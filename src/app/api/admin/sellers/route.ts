import { NextRequest, NextResponse } from 'next/server';
import { getSellers, createSeller } from '@/lib/supabase/sellers';

// Helper to get auth from request
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
      const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

      const { payload } = await jwtVerify(token, getSecretKey());

      const decoded = payload as {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
      };

      if (!decoded.isActive) {
        return null;
      }

      return { authenticated: true, role: decoded.role, email: decoded.email };
    } catch (error) {
      return null;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellers = await getSellers();
    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sellers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerData = await request.json();

    if (!sellerData.name || !sellerData.username) {
      return NextResponse.json(
        { error: 'Name and username are required' },
        { status: 400 }
      );
    }

    const seller = await createSeller(sellerData);

    if (!seller) {
      return NextResponse.json(
        { error: 'Failed to create seller. Ensure the username is unique.' },
        { status: 500 }
      );
    }

    return NextResponse.json(seller, { status: 201 });
  } catch (error) {
    console.error('Error creating seller:', error);
    return NextResponse.json(
      { error: 'Failed to create seller' },
      { status: 500 }
    );
  }
}
