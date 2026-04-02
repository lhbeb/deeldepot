import { NextRequest, NextResponse } from 'next/server';
import { getProductsBySeller } from '@/lib/supabase/sellers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id === 'null' || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid seller ID' }, { status: 400 });
    }

    const products = await getProductsBySeller(id);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}
