import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getAdminAuth(request: NextRequest) {
  const { shouldBypassAuth } = await import('@/lib/supabase/auth');
  if (shouldBypassAuth()) {
    return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
  }

  const token =
    request.cookies.get('admin_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '').trim();

  if (!token) return null;

  try {
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const decoded = payload as { role: string; isActive: boolean; email: string };
    if (!decoded.isActive) return null;
    const normalizedRole = decoded.role?.toUpperCase();
    if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(normalizedRole)) return null;
    return { authenticated: true, role: normalizedRole, email: decoded.email };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slugs, baseDomain } = body;

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ error: 'No product slugs provided' }, { status: 400 });
    }

    // Fetch only the requested products
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('slug, title, description, price, brand, listed_by')
      .in('slug', slugs)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }

    const affiliateData = products.map(p => ({
      brand_name: p.brand || '',
      product_display_name: p.title || '',
      short_note: (p.description || '').replace(/\r\n|\r|\n/g, ' ').trim().slice(0, 80),
      price_label: `$${Number(p.price || 0).toFixed(2)}`,
      affiliate_link_url: `${baseDomain || ''}/products/${p.slug}`,
      listed_by: p.listed_by || '',
    }));

    const jsonContent = JSON.stringify(affiliateData, null, 2);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="DeelDepot-affiliate-json-${date}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Affiliate JSON export error:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
