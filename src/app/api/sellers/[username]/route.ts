import { NextRequest, NextResponse } from 'next/server';
import { getSellerByUsername } from '@/lib/supabase/sellers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const seller = await getSellerByUsername(username);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }
    
    return NextResponse.json(seller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve seller' },
      { status: 500 }
    );
  }
}
