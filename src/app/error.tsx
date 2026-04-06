'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportError } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PAGE ERROR]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
    reportError({ error, context: 'error-boundary/page' });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#262626] mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          This page ran into an error. You can try again or go back to the homepage.
        </p>

        {/* Dev-only error detail */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-left">
            <p className="text-xs font-semibold text-red-700 mb-1 uppercase tracking-wide">Dev Error</p>
            <pre className="text-xs text-red-600 whitespace-pre-wrap break-words overflow-auto max-h-40">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ''}
            </pre>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#090A28] text-white text-sm font-semibold rounded-xl hover:bg-[#1c2070] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
