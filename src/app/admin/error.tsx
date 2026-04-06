'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ADMIN ERROR]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-[#262626]">Admin Page Error</h1>
            <p className="text-sm text-gray-500">An error occurred in the admin dashboard</p>
          </div>
        </div>

        {/* Always show full error in admin (you're authenticated) */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Error Details</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap break-words overflow-auto max-h-48 font-mono">
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
            {process.env.NODE_ENV === 'development' && error.stack
              ? `\n\nStack:\n${error.stack}`
              : ''}
          </pre>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2.5 bg-[#090A28] text-white text-sm font-semibold rounded-xl hover:bg-[#1c2070] transition-colors"
          >
            Retry
          </button>
          <Link
            href="/admin"
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors text-center"
          >
            ← Admin Home
          </Link>
        </div>
      </div>
    </div>
  );
}
