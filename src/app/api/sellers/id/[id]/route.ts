import { NextRequest, NextResponse } from 'next/server';
import { getSellerById } from '@/lib/supabase/sellers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Return not found immediately for invalid IDs like 'null' or 'undefined'
    if (!id || id === 'null' || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid seller ID' }, { status: 400 });
    }

    const seller = await getSellerById(id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }
    
    return NextResponse.json(seller);
  } catch (error) {
    console.error('Error fetching seller by ID:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve seller' },
      { status: 500 }
    );
  }
}
