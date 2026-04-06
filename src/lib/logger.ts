type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  context?: string;
  data?: unknown;
  error?: unknown;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.stack || error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function log(level: LogLevel, payload: LogPayload) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]${payload.context ? ` [${payload.context}]` : ''}`;
  const msg = `${prefix} ${payload.message}`;

  if (level === 'error') {
    console.error(msg, payload.data ?? '', payload.error ? formatError(payload.error) : '');
  } else if (level === 'warn') {
    console.warn(msg, payload.data ?? '');
  } else {
    console.log(msg, payload.data ?? '');
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function logInfo(message: string, data?: unknown, context?: string) {
  log('info', { message, data, context });
}

export function logWarn(message: string, data?: unknown, context?: string) {
  log('warn', { message, data, context });
}

export function logError(error: unknown, context?: string, data?: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  log('error', { message, error, data, context });
}

export function apiError(error: unknown, context: string, status = 500) {
  logError(error, context);
  const message = error instanceof Error ? error.message : 'Internal server error';
  return Response.json({ error: message }, { status });
}

// ─── Client-side remote reporting ────────────────────────────────────────────

interface ReportPayload {
  error: Error | unknown;
  context?: string;
  type?: 'client' | 'api' | 'server';
  extra?: Record<string, unknown>;
}

/**
 * Silently sends an error to /api/log-error so it lands in your admin Error Log.
 * Safe to call anywhere — never throws, never blocks.
 */
export function reportError({ error, context, type = 'client', extra }: ReportPayload): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    const route = typeof window !== 'undefined' ? window.location.pathname : undefined;

    // fire-and-forget — don't await
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, stack, url, route, context, extra }),
      keepalive: true, // survives page unload
    }).catch(() => {}); // swallow any fetch error
  } catch {
    // never throw from error reporter
  }
}

