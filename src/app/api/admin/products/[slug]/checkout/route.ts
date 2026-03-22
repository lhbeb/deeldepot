import { NextRequest, NextResponse } from 'next/server';
import { updateCheckoutLink } from '@/lib/supabase/products';

// Helper to get auth from request (same as main route)
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

// PATCH - Update checkout link
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check authentication
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { checkout_link } = await request.json();

    if (!checkout_link) {
      return NextResponse.json(
        { error: 'Missing checkout_link in request body' },
        { status: 400 }
      );
    }

    const product = await updateCheckoutLink(slug, checkout_link);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating checkout link:', error);
    return NextResponse.json(
      { error: 'Failed to update checkout link' },
      { status: 500 }
    );
  }
}

