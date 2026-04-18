import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Helper to get admin auth (same pattern as other admin routes)
async function getAdminAuth(request: NextRequest) {
  const { shouldBypassAuth } = await import('@/lib/supabase/auth');
  if (shouldBypassAuth()) {
    return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
  }
  const token = request.cookies.get('admin_token')?.value;
  if (token) {
    try {
      const { jwtVerify } = await import('jose');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      const decoded = payload as { role: string; isActive: boolean; email: string };
      if (!decoded.isActive) return null;
      if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(decoded.role?.toUpperCase())) return null;
      return { authenticated: true, role: decoded.role, email: decoded.email };
    } catch { return null; }
  }
  return null;
}

/**
 * POST /api/admin/payouts/send
 * Sends a PayPal Payout to a seller email using the PayPal Payouts API.
 * If the seller has no PayPal account, PayPal holds the funds and emails them to claim.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, sellerEmail, amount, currency, note } = body;

    if (!orderId || !sellerEmail || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, sellerEmail, amount' },
        { status: 400 }
      );
    }

    // Load PayPal credentials from payment_settings
    const { data: paypalSettings, error: settingsError } = await supabaseAdmin
      .from('payment_settings')
      .select('payee_email, publishable_key, secret_key')
      .eq('provider', 'paypal-unclaimed')
      .single();

    const clientId = paypalSettings?.publishable_key;
    const clientSecret = paypalSettings?.secret_key;

    if (settingsError || !clientId || !clientSecret || clientSecret === 'paypal-not-applicable') {
      return NextResponse.json(
        { error: 'PayPal API credentials not configured. Go to Admin → Payment Settings → PayPal Unclaimed and add your Client ID and Client Secret.' },
        { status: 400 }
      );
    }
    const paypalBase = 'https://api-m.paypal.com'; // Use sandbox: https://api-m.sandbox.paypal.com

    // Step 1: Get PayPal access token
    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('❌ [Payouts] Failed to get PayPal token:', err);
      return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 502 });
    }

    const { access_token } = await tokenRes.json();

    // Step 2: Send the Payout
    const batchId = `DEELDEPOT_${orderId}_${Date.now()}`;
    const payoutPayload = {
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: 'You have a payment from DeelDepot',
        email_message: 'You have received a payment for your sale on DeelDepot. If you do not have a PayPal account, please create one to claim your funds.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: Number(amount).toFixed(2),
            currency: currency || 'USD',
          },
          receiver: sellerEmail.trim(),
          note: note || `Payout for order ${orderId} - DeelDepot`,
          sender_item_id: orderId,
        },
      ],
    };

    const payoutRes = await fetch(`${paypalBase}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(payoutPayload),
    });

    const payoutData = await payoutRes.json();

    if (!payoutRes.ok) {
      console.error('❌ [Payouts] PayPal Payout failed:', JSON.stringify(payoutData, null, 2));
      return NextResponse.json(
        { error: 'PayPal Payout failed', details: payoutData },
        { status: 502 }
      );
    }

    const payoutBatchId = payoutData.batch_header?.payout_batch_id || batchId;

    // Step 3: Update order status in DB
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payout_status: 'sent',
        payout_batch_id: payoutBatchId,
        payout_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('⚠️ [Payouts] Order update failed (payout WAS sent):', updateError);
    }

    console.log(`✅ [Payouts] Payout sent. BatchID: ${payoutBatchId} → ${sellerEmail} for order ${orderId}`);

    return NextResponse.json({
      success: true,
      payoutBatchId,
      sellerEmail,
      amount,
      currency: currency || 'USD',
    });

  } catch (error: any) {
    console.error('❌ [Payouts] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
