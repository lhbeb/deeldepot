"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { CreditCard, Save, ShieldOff, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentSettingsPage() {
    const router = useRouter();
    const [adminRole, setAdminRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [publishableKey, setPublishableKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [mode, setMode] = useState('live');
    const [showSecret, setShowSecret] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    
    // PayPal Unclaimed state
    const [paypalEmail, setPaypalEmail] = useState('');
    const [paypalClientId, setPaypalClientId] = useState('');
    const [paypalSecret, setPaypalSecret] = useState('');
    const [showPaypalSecret, setShowPaypalSecret] = useState(false);
    const [isPaypalConfigured, setIsPaypalConfigured] = useState(false);
    const [isPaypalSaving, setIsPaypalSaving] = useState(false);
    
    // Feedback
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial load
    useEffect(() => {
        // Parse admin role constraint
        const role = document.cookie
            .split('; ')
            .find(row => row.startsWith('admin_role='))
            ?.split('=')[1];
            
        // Some systems use super-admin, others SUPER_ADMIN
        setAdminRole(role?.toUpperCase() || '');

        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/payment-settings', {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                
                // Stripe data
                if (data.stripe?.isConfigured) {
                    setIsConfigured(true);
                    setPublishableKey(data.stripe.publishableKey || '');
                    setSecretKey(data.stripe.secretKey || '');
                    setMode(data.stripe.mode || 'live');
                }

                // PayPal data
                if (data.paypal?.isConfigured) {
                    setIsPaypalConfigured(true);
                    setPaypalEmail(data.paypal.payeeEmail || '');
                    if (data.paypal.clientId) setPaypalClientId(data.paypal.clientId);
                    if (data.paypal.hasSecret) setPaypalSecret('••••••••••••••••'); // masked
                }
            } else if (res.status === 401) {
                console.log("Unauthorized to fetch settings");
            }
        } catch (error) {
            console.error('Failed to fetch payment settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage(null);

        // Validation
        if (!publishableKey.startsWith('pk_')) {
            setStatusMessage({ type: 'error', text: 'Publishable Key must start with pk_' });
            setIsSaving(false);
            return;
        }
        
        if (secretKey.includes('*')) {
            setStatusMessage({ type: 'error', text: 'Please enter the full secret key replacing the masked value' });
            setIsSaving(false);
            return;
        }

        if (!secretKey.startsWith('sk_') && !secretKey.startsWith('rk_')) {
            setStatusMessage({ type: 'error', text: 'Secret Key must start with sk_ or rk_' });
            setIsSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    provider: 'stripe',
                    publishableKey,
                    secretKey,
                    mode
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatusMessage({ type: 'success', text: 'Payment settings saved successfully.' });
                // Re-fetch to get masked version back
                fetchSettings();
            } else {
                setStatusMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePaypal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPaypalSaving(true);
        setStatusMessage(null);

        if (!paypalEmail.includes('@')) {
            setStatusMessage({ type: 'error', text: 'Please enter a valid email address' });
            setIsPaypalSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    provider: 'paypal-unclaimed',
                    payeeEmail: paypalEmail,
                    ...(paypalClientId.trim() && { clientId: paypalClientId.trim() }),
                    ...(paypalSecret && !paypalSecret.includes('•') && { secretKey: paypalSecret }),
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatusMessage({ type: 'success', text: 'PayPal settings saved successfully.' });
                fetchSettings();
            } else {
                setStatusMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setIsPaypalSaving(false);
        }
    };

    const isAuthorized =
        adminRole === 'SUPER_ADMIN' ||
        adminRole === 'SUPER-ADMIN' ||
        adminRole === 'REGULAR_ADMIN' ||
        adminRole === 'ADMIN';

    return (
        <AdminLayout
            title="Payment Settings"
            subtitle="Manage Stripe API keys and payment configurations."
        >
            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                </div>
            ) : !isAuthorized ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                        <ShieldOff className="h-10 w-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-[#262626] mb-2">Admin Only</h2>
                    <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                        Payment settings are restricted to <strong>Admin</strong> accounts.
                        Please contact an Administrator if you need access.
                    </p>
                </div>
            ) : (
                <div className="max-w-6xl space-y-6">
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 ${
                            statusMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {statusMessage.type === 'success' ? (
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                            ) : (
                                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
                            )}
                            <div className="text-sm font-medium">{statusMessage.text}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                        {/* Stripe Configuration Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#262626] text-base">Stripe Integration</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <p className="text-sm text-gray-500">{isConfigured ? 'Active & Configured' : 'Not Configured'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Environment Mode</label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="w-full sm:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent text-sm"
                                >
                                    <option value="test">Test Mode</option>
                                    <option value="live">Live Mode</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">Controls which Stripe environment runs.</p>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                                <input
                                    type="text"
                                    value={publishableKey}
                                    onChange={(e) => setPublishableKey(e.target.value)}
                                    placeholder="pk_..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent text-sm font-mono"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">Publicly exposed key used for frontend integrations.</p>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? "text" : "password"}
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        placeholder="sk_..."
                                        className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent text-sm font-mono"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none"
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-amber-600 mt-1.5 ml-1 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" /> 
                                    Keep this secret. This is never exposed to the browser.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#090A28] text-white rounded-xl hover:bg-[#1c2070] transition-colors text-sm font-medium shadow-lg shadow-[#090A28]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                        </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20.067 8.478c.492.21 1.05.51 1.05 1.442a5.577 5.577 0 01-1.05 3.32c-.99 1.44-2.73 1.44-3.57 1.44h-2.1l-.81 4.5h-3.69l1.62-9h3.69c.84 0 2.22 0 3.21.9zm-9.36.9h2.1a1.8 1.8 0 000-3.6h-2.1l-.65 3.6z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#262626] text-base">PayPal Unclaimed settings</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${isPaypalConfigured ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                        <p className="text-sm text-gray-500">{isPaypalConfigured ? 'Global Email Active' : 'Not Configured'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSavePaypal} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Platform PayPal Email <span className="text-gray-400 font-normal">(receives all buyer payments)</span></label>
                                <input
                                    type="email"
                                    value={paypalEmail}
                                    onChange={(e) => setPaypalEmail(e.target.value)}
                                    placeholder="e.g. platform@yourdomain.com"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent text-sm"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">Your verified PayPal Business account. All buyer payments land here first — you then payout to sellers from the <strong>Payouts</strong> dashboard.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PayPal API Client ID <span className="text-amber-600">(for Payouts)</span></label>
                                <input
                                    type="text"
                                    value={paypalClientId}
                                    onChange={(e) => setPaypalClientId(e.target.value)}
                                    placeholder="AaBbCcDd... (from developer.paypal.com)"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent text-sm font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">Live Client ID from your PayPal REST app. Required together with the secret below to send payouts.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PayPal API Client Secret <span className="text-amber-600">(for Payouts)</span></label>
                                <div className="relative">
                                    <input
                                        type={showPaypalSecret ? 'text' : 'password'}
                                        value={paypalSecret}
                                        onChange={(e) => setPaypalSecret(e.target.value)}
                                        placeholder="Paste your PayPal Client Secret here"
                                        className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent text-sm font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md"
                                    >
                                        {showPaypalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-amber-600 mt-1.5 ml-1 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Required to send PayPal Payouts to sellers. Get this from developer.paypal.com → Live credentials.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isPaypalSaving}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#090A28] text-white rounded-xl hover:bg-[#1c2070] transition-colors text-sm font-medium shadow-lg shadow-[#090A28]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPaypalSaving ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save PayPal Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    </div>

                </div>
            )}
        </AdminLayout>
    );
}
