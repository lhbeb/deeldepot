import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = req.cookies.get('admin_token')?.value;
  const token = bearerToken || cookieToken;

  if (!token) return null;

  try {
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as { role: string; isActive: boolean; email: string };
    const normalizedRole = decoded.role?.toUpperCase();

    if (!decoded.isActive) return null;
    if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(normalizedRole)) return null;

    return { email: decoded.email, role: normalizedRole };
  } catch (error) {
    console.error('❌ [ERROR LOG AUTH] JWT verification failed:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved');

    let query = supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    
    if (resolved && resolved !== 'all') {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return Response.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return Response.json(logs || []);
  } catch (error) {
    console.error('Unexpected error fetching logs:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
