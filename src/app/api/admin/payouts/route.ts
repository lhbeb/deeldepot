import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getAdminAuth(request: NextRequest) {
  const { shouldBypassAuth } = await import('@/lib/supabase/auth');
  if (shouldBypassAuth()) return { authenticated: true };
  const token = request.cookies.get('admin_token')?.value;
  if (token) {
    try {
      const { jwtVerify } = await import('jose');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      const decoded = payload as { role: string; isActive: boolean };
      if (!decoded.isActive) return null;
      if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(decoded.role?.toUpperCase())) return null;
      return { authenticated: true };
    } catch { return null; }
  }
  return null;
}

/**
 * GET /api/admin/payouts
 * Returns orders with paypal-direct flow, optionally filtered by payout_status.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const payoutStatus = searchParams.get('payout_status'); // 'pending' | 'sent' | null (all)
    const flow = searchParams.get('flow') || 'paypal-direct';

    let query = supabaseAdmin
      .from('orders')
      .select('id, product_title, product_price, customer_email, seller_payee_email, payout_status, payout_batch_id, payout_sent_at, created_at, checkout_flow')
      .eq('checkout_flow', flow)
      .order('created_at', { ascending: false })
      .limit(100);

    if (payoutStatus) {
      query = query.eq('payout_status', payoutStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [Payouts] DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
