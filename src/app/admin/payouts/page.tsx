"use client";

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { RefreshCw, Send, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface PendingPayout {
  id: string;
  product_title: string;
  product_price: number;
  customer_email: string;
  seller_payee_email: string;
  payout_status: string;
  payout_batch_id: string | null;
  payout_sent_at: string | null;
  created_at: string;
  checkout_flow: string;
}

export default function PayoutsPage() {
  const [orders, setOrders] = useState<PendingPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'sent' | 'all'>('pending');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({ flow: 'paypal-direct' });
      if (statusFilter !== 'all') params.set('payout_status', statusFilter);

      const res = await fetch(`/api/admin/payouts?${params}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load payouts.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error loading payouts.' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleSendPayout = async (order: PendingPayout) => {
    if (!order.seller_payee_email) {
      setMessage({ type: 'error', text: 'No seller email on this order.' });
      return;
    }
    setSendingId(order.id);
    setMessage(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/payouts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          orderId: order.id,
          sellerEmail: order.seller_payee_email,
          amount: order.product_price,
          currency: 'USD',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `✅ Payout sent to ${order.seller_payee_email}. Batch ID: ${data.payoutBatchId}` });
        fetchPayouts();
      } else {
        setMessage({ type: 'error', text: data.error || 'Payout failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error sending payout.' });
    } finally {
      setSendingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="h-3 w-3" />Pending</span>;
      case 'sent': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" />Sent</span>;
      case 'failed': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="h-3 w-3" />Failed</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{status}</span>;
    }
  };

  return (
    <AdminLayout title="Seller Payouts" subtitle="Send PayPal payouts to sellers after buyers have paid the platform.">
      <div className="max-w-6xl space-y-5">
        {/* Info Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>How this works:</strong> Buyer paid your PayPal platform account. Click "Send Payout" to forward the seller's share to their email via PayPal Payouts. If the seller has no PayPal account, PayPal will email them to claim the funds.
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <XCircle className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Filters + Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['pending', 'sent', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === f ? 'bg-[#090A28] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={fetchPayouts} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No {statusFilter === 'all' ? '' : statusFilter} payouts</p>
              <p className="text-gray-400 text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller Email</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#262626] line-clamp-2 max-w-[220px]">{order.product_title}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{order.customer_email}</td>
                      <td className="px-5 py-4">
                        {order.seller_payee_email ? (
                          <span className="font-mono text-[#262626]">{order.seller_payee_email}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[#262626]">
                        ${Number(order.product_price).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">{statusBadge(order.payout_status)}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        {order.payout_status === 'pending' && order.seller_payee_email ? (
                          <button
                            onClick={() => handleSendPayout(order)}
                            disabled={sendingId === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EFC154] hover:brightness-95 text-[#111] rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingId === order.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            {sendingId === order.id ? 'Sending...' : 'Send Payout'}
                          </button>
                        ) : order.payout_status === 'sent' && order.payout_batch_id ? (
                          <a
                            href={`https://www.paypal.com/activity/payment/${order.payout_batch_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
