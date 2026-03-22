"use client";

import AdminSidebar from './AdminSidebar';
import ScrollLockDebug from './ScrollLockDebug';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

// Added internal copy component for clean state management
function CopyBadge({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors
        ${copied ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'}`}
      title={`Copy ${label}`}
    >
      <span className="text-gray-400 font-normal">{label}:</span> {value}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar />

      <div className="lg:ml-64">
        {/* Header */}
        {(title || subtitle) && (
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center gap-4">
                {title && (
                  <h1 className="text-2xl font-bold text-[#262626]">{title}</h1>
                )}

                {/* Mail Project specific credentials shortcuts */}
                {title === 'Mail Project' && (
                  <div className="flex items-center gap-2 mt-1">
                    <CopyBadge label="User" value="elmahboubi" />
                    <CopyBadge label="Password" value="Localserver!!2" />
                  </div>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6" style={{ overflow: 'visible' }}>
          {children}
        </main>
      </div>

      {/* Emergency scroll unlock button (only shows when scroll is stuck) */}
      <ScrollLockDebug />
    </div>
  );
}
