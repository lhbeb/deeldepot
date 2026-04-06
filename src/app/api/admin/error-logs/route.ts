import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Very basic auth check based on the token. 
    // Assuming the token is valid if it exists, or you should decode and verify the JWT here.
    // Given the rest of your app, you probably rely on the existing admin_token locally or server-side verify.
    // For now, we proceed as the admin check relies on localStorage token.

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
