import { NextRequest, NextResponse } from 'next/server';
import { getOrdersCount } from '@/lib/supabase/orders';

// GET - Return only the total order count (bypasses 1000-row PostgREST limit)
export async function GET(request: NextRequest) {
  try {
    // Basic auth check via Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
      request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getOrdersCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching orders count:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders count' }, { status: 500 });
  }
}
