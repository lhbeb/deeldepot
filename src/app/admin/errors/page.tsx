'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { AlertTriangle, CheckCircle, RefreshCw, Trash2, Filter, X, ExternalLink, Clock, Globe, Monitor, Code } from 'lucide-react';

interface ErrorLog {
  id: string;
  created_at: string;
  type: 'client' | 'api' | 'server';
  message: string;
  stack?: string;
  url?: string;
  route?: string;
  context?: string;
  user_agent?: string;
  extra?: Record<string, unknown>;
  resolved: boolean;
  resolved_at?: string;
  resolved_note?: string;
}

const TYPE_COLORS: Record<string, string> = {
  client: 'bg-orange-100 text-orange-700 border-orange-200',
  api: 'bg-blue-100 text-blue-700 border-blue-200',
  server: 'bg-red-100 text-red-700 border-red-200',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function parseUA(ua?: string) {
  if (!ua) return 'Unknown';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 30);
}

export default function ErrorLogPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('unresolved');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterResolved !== 'all') params.set('resolved', filterResolved === 'resolved' ? 'true' : 'false');

      const res = await fetch(`/api/admin/error-logs?${params}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterResolved]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const markResolved = async (id: string, resolved: boolean) => {
    setResolving(id);
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/admin/error-logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ resolved }),
    });
    setResolving(null);
    fetchLogs();
  };

  const deleteLog = async (id: string) => {
    if (!confirm('Delete this error log?')) return;
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/admin/error-logs/${id}`, {
      method: 'DELETE',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    fetchLogs();
  };

  const unresolvedCount = logs.filter(l => !l.resolved).length;

  return (
    <AdminLayout title="Error Log">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#262626]">Error Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Errors caught from customer sessions
            {unresolvedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                {unresolvedCount} unresolved
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          {['all', 'client', 'api', 'server'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === t ? 'bg-[#090A28] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          {[['unresolved', 'Unresolved'], ['resolved', 'Resolved'], ['all', 'All']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterResolved(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterResolved === val ? 'bg-[#090A28] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading errors...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No errors found</p>
          <p className="text-gray-400 text-sm mt-1">Great news — your app is clean!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div
              key={log.id}
              className={`bg-white rounded-2xl border transition-all ${log.resolved ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}
            >
              {/* Row header */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${log.resolved ? 'bg-green-50' : 'bg-red-50'}`}>
                  {log.resolved
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <AlertTriangle className="h-4 w-4 text-red-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${TYPE_COLORS[log.type] ?? TYPE_COLORS.client}`}>
                      {log.type}
                    </span>
                    {log.context && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                        {log.context}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{timeAgo(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#262626] truncate">{log.message}</p>
                  {log.route && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Globe className="h-3 w-3" />{log.route}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => markResolved(log.id, !log.resolved)}
                    disabled={resolving === log.id}
                    title={log.resolved ? 'Mark unresolved' : 'Mark resolved'}
                    className={`p-1.5 rounded-lg transition-colors ${log.resolved ? 'hover:bg-orange-50 text-orange-400' : 'hover:bg-green-50 text-green-500'}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === log.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
                  {log.url && (
                    <div className="flex items-start gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">{log.url}</a>
                    </div>
                  )}
                  {log.user_agent && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Monitor className="h-3.5 w-3.5 text-gray-400" />
                      {parseUA(log.user_agent)}
                    </div>
                  )}
                  {log.stack && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Code className="h-3 w-3" /> Stack Trace
                      </div>
                      <pre className="text-xs bg-gray-950 text-gray-200 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words max-h-64">
                        {log.stack}
                      </pre>
                    </div>
                  )}
                  {log.extra && Object.keys(log.extra).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Extra Data</p>
                      <pre className="text-xs bg-gray-50 text-gray-700 rounded-xl p-3 overflow-x-auto">
                        {JSON.stringify(log.extra, null, 2)}
                      </pre>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                    {log.resolved && log.resolved_at && ` · Resolved ${timeAgo(log.resolved_at)}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
