import { NextRequest, NextResponse } from 'next/server';
import { getProductsByCollection } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Support both ?collection= and ?category= for backward compatibility
    const requestedCollection = (searchParams.get('collection') || searchParams.get('category'))?.toLowerCase() || '';
    
    if (!requestedCollection.trim()) {
      return NextResponse.json([]);
    }

    // Rely exclusively on the centralized DB-level collection querying
    const products = await getProductsByCollection(requestedCollection);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Collection API Error:', error);
    return NextResponse.json({ error: 'Failed to get products by collection' }, { status: 500 });
  }
} 