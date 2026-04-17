import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vfuedgrheyncotoxseos.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Security headers to allow Ko-fi iframes and prevent ad blocker issues
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ko-fi.com https://*.ko-fi.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://js.stripe.com https://chatapppay.vercel.app http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co https://analyticsapp-five.vercel.app https://deeldepot-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com",
              "style-src 'self' 'unsafe-inline' https://ko-fi.com https://*.ko-fi.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com https://ko-fi.com https://*.ko-fi.com http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co",
              "frame-src 'self' https://ko-fi.com https://*.ko-fi.com https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://*.stripe.com https://hooks.stripe.com https://chatapppay.vercel.app https://analyticsapp-five.vercel.app https://deeldepot-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com",
              "connect-src 'self' https://ko-fi.com https://*.ko-fi.com https://vfuedgrheyncotoxseos.supabase.co https://www.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net https://api.stripe.com https://*.stripe.com https://hooks.stripe.com https://*.stripe.network https://chatapppay.vercel.app http://*.tidio.co https://*.tidio.co http://*.tidio.com https://*.tidio.com https://analyticsapp-five.vercel.app https://analyticsapp.vercel.app https://deeldepot-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com",
              "media-src 'self' http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://ko-fi.com https://*.ko-fi.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://ko-fi.com" "https://*.ko-fi.com")',
          },
        ],
      },
      // Specific headers for checkout page to ensure Ko-fi iframe works
      {
        source: '/checkout',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ko-fi.com https://*.ko-fi.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://js.stripe.com https://chatapppay.vercel.app http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co https://analyticsapp-five.vercel.app https://deeldepot-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com",
              "style-src 'self' 'unsafe-inline' https://ko-fi.com https://*.ko-fi.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com https://ko-fi.com https://*.ko-fi.com http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co",
              "frame-src 'self' https://ko-fi.com https://*.ko-fi.com https://js.stripe.com https://*.stripe.com https://hooks.stripe.com https://chatapppay.vercel.app https://analyticsapp-five.vercel.app https://deeldepot-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com",
              "connect-src 'self' https://ko-fi.com https://*.ko-fi.com https://vfuedgrheyncotoxseos.supabase.co https://www.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net https://api.stripe.com https://*.stripe.com https://hooks.stripe.com https://*.stripe.network https://chatapppay.vercel.app http://*.tidio.co https://*.tidio.co http://*.tidio.com https://*.tidio.com https://analyticsapp-five.vercel.app https://analyticsapp.vercel.app https://deeldepot-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com",
              "media-src 'self' http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co",
              "object-src 'none'",
              "form-action 'self' https://ko-fi.com https://*.ko-fi.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // Vercel optimizations
  compress: true,
  poweredByHeader: false,
  // Ensure proper serverless function timeouts
  experimental: {
    // Optimize serverless functions for Vercel
    serverActions: {
      bodySizeLimit: '8mb', // Match ZIP file limit
    },
  },
};

export default nextConfig;

