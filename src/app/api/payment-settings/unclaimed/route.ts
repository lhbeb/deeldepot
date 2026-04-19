import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * @deprecated This endpoint has been renamed to /api/payment-settings/paypal-direct
 * This redirect shim exists for backward compatibility only.
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/api/payment-settings/paypal-direct', request.url);
  return NextResponse.redirect(redirectUrl, { status: 308 }); // 308 = Permanent Redirect
}
