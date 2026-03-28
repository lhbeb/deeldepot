import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    const { id } = await params;

    // Verify user is SUPER_ADMIN
    const adminRole = request.cookies.get('admin_role')?.value;
    if (adminRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Only Super Admins can undo order conversion.' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Perform the update — set is_converted back to false
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ is_converted: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ [UNMARK-CONVERTED] Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to undo conversion', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or update blocked' },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [UNMARK-CONVERTED] Order ${id} unmarked in ${duration}ms`);

    return NextResponse.json({ success: true, order: data[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
