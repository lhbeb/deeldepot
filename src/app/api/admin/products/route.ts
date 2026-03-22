import { NextRequest, NextResponse } from 'next/server';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/supabase/products';
import { supabaseAdmin } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { authenticateAdmin } from '@/lib/supabase/auth';

const FEATURE_LIMIT = 6;

async function assertFeaturedLimit(canFeature: boolean) {
  if (!canFeature) return;

  const { count, error } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_featured', true);

  if (error) {
    console.error('Failed to check featured product count:', error);
    throw new Error('Unable to verify featured product limit. Please try again.');
  }

  if ((count ?? 0) >= FEATURE_LIMIT) {
    const limitError = new Error(`Maximum of ${FEATURE_LIMIT} featured products reached. Unfeature another product first.`);
    (limitError as any).statusCode = 400;
    throw limitError;
  }
}

function revalidateProductPaths(slug?: string) {
  revalidatePath('/');
  revalidatePath('/products');
  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

// Helper to get auth from request
async function getAdminAuth(request: NextRequest) {
  // Bypass authentication in development if enabled
  const { shouldBypassAuth } = await import('@/lib/supabase/auth');
  if (shouldBypassAuth()) {
    console.log('🔓 [AUTH] Bypassing authentication for API request');
    return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
  }

  // Check for admin_token cookie (JWT token from our login route)
  const token = request.cookies.get('admin_token')?.value;

  if (token) {
    try {
      // Verify JWT token using jose (same as middleware)
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

      // Check if admin is active
      if (!decoded.isActive) {
        console.log('🚫 [AUTH] Admin account is deactivated:', decoded.email);
        return null;
      }

      console.log('✅ [AUTH] JWT token verified for:', decoded.email, 'Role:', decoded.role);
      return { authenticated: true, role: decoded.role, email: decoded.email };
    } catch (error) {
      console.error('❌ [AUTH] JWT verification failed:', error);
      return null;
    }
  }

  // No valid authentication found
  console.log('🚫 [AUTH] No valid admin_token cookie found');
  return null;
}

// GET - List all products (admin view - includes drafts)
export async function GET(request: NextRequest) {
  try {
    // Optional: Add auth check here if needed
    // const auth = await getAdminAuth(request);
    // if (!auth) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Admin view should include drafts
    const products = await getProducts(true);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productData = await request.json();

    // Validate required fields
    const requiredFields = [
      'slug',
      'title',
      'description',
      'price',
      'images',
      'condition',
      'category',
      'brand',
      'checkout_link',
      'listed_by',
      'collections',
    ];

    // Validate collections is an array and not empty
    if (!productData.collections || !Array.isArray(productData.collections) || productData.collections.length === 0) {
      return NextResponse.json(
        { error: 'collections is required and must be a non-empty array. Please select at least one collection.' },
        { status: 400 }
      );
    }

    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate listed_by value
    const validListedByValues = ['walid', 'abdo', 'jebbar', 'amine', 'mehdi', 'othmane', 'janah', 'youssef', 'yassine'];
    if (productData.listed_by && !validListedByValues.includes(productData.listed_by)) {
      return NextResponse.json(
        { error: `Invalid listed_by value. Must be one of: ${validListedByValues.join(', ')}` },
        { status: 400 }
      );
    }

    try {
      await assertFeaturedLimit(productData.is_featured ?? productData.isFeatured ?? false);
    } catch (limitError: any) {
      const status = limitError.statusCode || 500;
      return NextResponse.json({ error: limitError.message }, { status });
    }

    const product = await createProduct({
      ...productData,
      payee_email: productData.payee_email || '',
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    revalidateProductPaths(product.slug);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

