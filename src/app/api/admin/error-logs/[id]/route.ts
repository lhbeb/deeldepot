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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuth(req);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { resolved } = body;

    const { error } = await supabaseAdmin
      .from('error_logs')
      .update({ 
        resolved, 
        resolved_at: resolved ? new Date().toISOString() : null 
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating log:', error);
      return Response.json({ error: 'Failed to update log' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error updating log:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuth(req);
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from('error_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting log:', error);
      return Response.json({ error: 'Failed to delete log' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting log:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
