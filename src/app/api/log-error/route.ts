import { supabaseAdmin } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      type = 'client',
      message,
      stack,
      url,
      route,
      context,
      extra,
    } = body;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message required' }, { status: 400 });
    }

    // Ignore known noise
    const ignoredMessages = [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Script error',
    ];
    if (ignoredMessages.some((m) => message.includes(m))) {
      return Response.json({ ok: true, ignored: true });
    }

    const user_agent = req.headers.get('user-agent') ?? undefined;

    const { error } = await supabaseAdmin.from('error_logs').insert({
      type,
      message: message.slice(0, 2000), // cap length
      stack: stack?.slice(0, 5000),
      url: url?.slice(0, 500),
      route: route?.slice(0, 200),
      context: context?.slice(0, 200),
      user_agent: user_agent?.slice(0, 300),
      extra: extra ?? null,
    });

    if (error) {
      // Don't surface DB errors to the client
      console.error('[log-error API] DB insert failed:', error.message);
      return Response.json({ ok: false }, { status: 200 }); // still 200 — don't cascade
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[log-error API] Unexpected error:', err);
    return Response.json({ ok: false }, { status: 200 }); // fail silently
  }
}
