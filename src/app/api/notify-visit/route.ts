import { NextRequest, NextResponse } from 'next/server';

// Get Telegram credentials from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function deviceTypeEmoji(type: string) {
  if (type === 'Mobile') return '📱';
  if (type === 'Tablet') return '💻';
  return '🖥️';
}

function countryCodeToFlagEmoji(countryCode: string) {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

export async function POST(req: NextRequest) {
  try {
    // Check if Telegram is configured
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('⚠️ Telegram credentials not configured. Skipping notification.');
      return NextResponse.json({ ok: true, skipped: true, reason: 'Telegram not configured' });
    }

    const data = await req.json();
    const { device, deviceType, fingerprint, url, productTitle, productSlug, productPrice, action } = data;

    // Enhanced IP detection - check multiple headers
    let ip = '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare
    const xClientIp = req.headers.get('x-client-ip');

    // Priority: Cloudflare > X-Real-IP > X-Forwarded-For > X-Client-IP
    if (cfConnectingIp) {
      ip = cfConnectingIp.trim();
    } else if (realIp) {
      ip = realIp.trim();
    } else if (forwardedFor) {
      // X-Forwarded-For can be a comma-separated list, take the first one
      ip = forwardedFor.split(',')[0].trim();
    } else if (xClientIp) {
      ip = xClientIp.trim();
    }

    // Filter out localhost/private IPs
    const isLocalhost = !ip ||
      ip === '::1' ||
      ip === '127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip === 'localhost';

    if (isLocalhost) {
      ip = '';
      console.log('🏠 [Telegram] Localhost detected, skipping geo lookup');
    }

    // Fetch geo info with multiple fallback services
    let country = 'Unknown';
    let countryFlag = '';
    let isp = 'Unknown';
    let geoSource = 'none';

    if (ip) {
      console.log(`🌍 [Telegram] Looking up geo for IP: ${ip}`);

      // Try ipwho.is first (most reliable, includes country_code + ISP)
      try {
        const geoRes = await fetch(`https://ipwho.is/${ip}`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.success && geo.country) {
            country = geo.country;
            countryFlag = geo.country_code ? countryCodeToFlagEmoji(geo.country_code) : '';
            isp = geo.connection?.isp || geo.connection?.org || 'Unknown';
            geoSource = 'ipwho.is';
            console.log(`✅ [Telegram] Geo found via ipwho.is: ${country} (${geo.country_code}) ISP: ${isp}`);
          }
        }
      } catch (e) {
        console.warn('⚠️ [Telegram] ipwho.is failed:', e instanceof Error ? e.message : String(e));
      }

      // Fallback 1: ip-api.com (free, no key required) — add isp to fields
      if (country === 'Unknown') {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,isp`, {
            signal: AbortSignal.timeout(5000)
          });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.status === 'success' && geo.country) {
              country = geo.country;
              countryFlag = geo.countryCode ? countryCodeToFlagEmoji(geo.countryCode) : '';
              isp = geo.isp || 'Unknown';
              geoSource = 'ip-api.com';
              console.log(`✅ [Telegram] Geo found via ip-api.com: ${country} (${geo.countryCode}) ISP: ${isp}`);
            }
          }
        } catch (e) {
          console.warn('⚠️ [Telegram] ip-api.com failed:', e instanceof Error ? e.message : String(e));
        }
      }

      // Fallback 2: ipapi.co (free tier: 1000 requests/day)
      if (country === 'Unknown') {
        try {
          const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
            signal: AbortSignal.timeout(5000)
          });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.country_name && !geo.error) {
              country = geo.country_name;
              countryFlag = geo.country_code ? countryCodeToFlagEmoji(geo.country_code) : '';
              isp = geo.org || 'Unknown';
              geoSource = 'ipapi.co';
              console.log(`✅ [Telegram] Geo found via ipapi.co: ${country} (${geo.country_code}) ISP: ${isp}`);
            }
          }
        } catch (e) {
          console.warn('⚠️ [Telegram] ipapi.co failed:', e instanceof Error ? e.message : String(e));
        }
      }

      if (country === 'Unknown') {
        console.error(`❌ [Telegram] All geo services failed for IP: ${ip}`);
      }
    } else {
      console.log('🔍 [Telegram] No valid IP found, using "Development/VPN"');
      country = 'Development/VPN';
      countryFlag = '🔒'; // Lock emoji for development/VPN
      isp = 'Local/VPN';
    }

    // Date and time (server-side)
    const now = new Date();
    const date = now.toLocaleDateString('en-US');
    const time = now.toLocaleTimeString('en-US');

    // Check if this is a checkout page visit, add to cart action, or About Us page visit
    const isCheckoutPage = url.includes('/checkout') || action === 'checkout_visit';
    const isAddToCart = action === 'add_to_cart';
    const isAboutPage = url.includes('/about');

    let message: string;
    if (isAddToCart && productTitle) {
      // Special notification for "Add to Cart" action
      message = [
        '🛒 <b>🛍️ ADD TO CART ACTION 🛍️</b> 🛒',
        '',
        '💰 <b>A user added a product to cart!</b> 💰',
        '',
        `📦 <b>Product:</b> ${productTitle}`,
        productPrice ? `💵 <b>Price:</b> $${productPrice.toLocaleString()}` : '',
        productSlug ? `🔗 <b>Product URL:</b> <a href="${url.replace('/checkout', `/products/${productSlug}`)}">View Product</a>` : '',
        '',
        `🔗 <b>Current URL:</b> <a href="${url}">${url}</a>`,
        `🔎 <b>IP:</b> <code>${ip || 'Unknown'}</code>`,
        `🏳️ <b>Country:</b> ${countryFlag ? countryFlag + ' ' : ''}${country}`,
        `🌐 <b>ISP:</b> <code>${isp}</code>`,
        `${deviceTypeEmoji(deviceType)} <b>Device:</b> ${deviceType} <code>${device}</code>`,
        `🆔 <b>Fingerprint:</b> <code>${fingerprint}</code>`,
        `📅 <b>Date:</b> <code>${date}</code>`,
        `⏰ <b>Time:</b> <code>${time}</code>`,
        '',
        '⚠️ <b>User is showing purchase intent!</b> ⚠️'
      ].filter(line => line !== '').join('\n');
    } else if (isCheckoutPage) {
      // Special high-priority message for checkout page
      message = [
        '🛒 <b>🚨 CHECKOUT PAGE VISIT 🚨</b> 🛒',
        '',
        '💰 <b>A user is on the checkout page!</b> 💰',
        '',
        `🔗 <b>URL:</b> <a href="${url}">${url}</a>`,
        `🔎 <b>IP:</b> <code>${ip || 'Unknown'}</code>`,
        `🏳️ <b>Country:</b> ${countryFlag ? countryFlag + ' ' : ''}${country}`,
        `🌐 <b>ISP:</b> <code>${isp}</code>`,
        `${deviceTypeEmoji(deviceType)} <b>Device:</b> ${deviceType} <code>${device}</code>`,
        `🆔 <b>Fingerprint:</b> <code>${fingerprint}</code>`,
        `📅 <b>Date:</b> <code>${date}</code>`,
        `⏰ <b>Time:</b> <code>${time}</code>`,
        '',
        '⚠️ <b>ACTION REQUIRED: Monitor this user for potential purchase!</b> ⚠️'
      ].join('\n');
    } else if (isAboutPage) {
      // Special notification for About Us page visit
      message = [
        '📖 <b>📄 ABOUT US PAGE VISIT 📄</b> 📖',
        '',
        '👤 <b>A user is viewing the About Us page!</b> 👤',
        '',
        `🔗 <b>URL:</b> <a href="${url}">${url}</a>`,
        `🔎 <b>IP:</b> <code>${ip || 'Unknown'}</code>`,
        `🏳️ <b>Country:</b> ${countryFlag ? countryFlag + ' ' : ''}${country}`,
        `🌐 <b>ISP:</b> <code>${isp}</code>`,
        `${deviceTypeEmoji(deviceType)} <b>Device:</b> ${deviceType} <code>${device}</code>`,
        `🆔 <b>Fingerprint:</b> <code>${fingerprint}</code>`,
        `📅 <b>Date:</b> <code>${date}</code>`,
        `⏰ <b>Time:</b> <code>${time}</code>`,
        '',
        'ℹ️ <b>User is learning about DeelDepot!</b> ℹ️'
      ].join('\n');
    } else {
      // Regular visit notification
      message = [
        '👀 <b>New Website Visit</b> 🚀',
        `🔗 <b>URL:</b> <a href="${url}">${url}</a>`,
        `🔎 <b>IP:</b> <code>${ip || 'Unknown'}</code>`,
        `🏳️ <b>Country:</b> ${countryFlag ? countryFlag + ' ' : ''}${country}`,
        `🌐 <b>ISP:</b> <code>${isp}</code>`,
        `${deviceTypeEmoji(deviceType)} <b>Device:</b> ${deviceType} <code>${device}</code>`,
        `🆔 <b>Fingerprint:</b> <code>${fingerprint}</code>`,
        `📅 <b>Date:</b> <code>${date}</code>`,
        `⏰ <b>Time:</b> <code>${time}</code>`
      ].join('\n');
    }

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          // For checkout pages, add to cart, and About Us page, ensure notification is sent
          ...((isCheckoutPage || isAddToCart || isAboutPage) && { disable_notification: false }),
        }),
      });
    } catch (e) {
      // Telegram error, log but don't throw
      console.error('Telegram API failed', e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Notify-visit API error:', e);
    return NextResponse.json({ ok: false, error: String(e) });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 });
} 