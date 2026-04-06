import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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
