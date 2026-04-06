'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console (and optionally to an external service here)
    console.error('[GLOBAL ERROR]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9ff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: '2.5rem',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 32px rgba(9,10,40,0.10)',
            border: '1px solid #eee',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: '#090A28', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            An unexpected error occurred. Our team has been notified.
          </p>

          {/* Show error message in dev only */}
          {process.env.NODE_ENV === 'development' && (
            <pre
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 12,
                color: '#dc2626',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: 24,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                background: '#090A28',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '10px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
