"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Terminal, Play, Eye, CheckCircle2, XCircle,
    AlertCircle, RefreshCw, ChevronDown, ChevronUp, X, ShieldOff
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScriptResult {
    slug: string;
    title: string;
    oldLink: string;
    newLink: string;
    updated: boolean;
}

interface ScriptRunResponse {
    scriptId: string;
    dryRun: boolean;
    affected: number;
    results: any[]; // shape varies by script: ScriptResult or FlowResult
    message: string;
}

type RunState = 'idle' | 'previewing' | 'preview_ready' | 'running' | 'done' | 'error';

interface ScriptCard {
    id: string;
    name: string;
    description: string;
    danger: boolean;
    params: Record<string, string>;
    paramLabels: Record<string, string>;
    paramPlaceholders?: Record<string, string>;
    paramOptions?: Record<string, string[]>;
    paramOptionLabels?: Record<string, Record<string, string>>; // human-readable labels for dropdown values
}

// ─── Available scripts ────────────────────────────────────────────────────────
const CHECKOUT_FLOWS = ['buymeacoffee', 'stripe', 'kofi', 'external', 'paypal-invoice', 'paypal-unclaimed', 'paypal-direct'];
const LISTED_BY_ADMINS = ['walid', 'abdo', 'jebbar', 'amine', 'mehdi', 'othmane', 'janah', 'youssef', 'yassine'];

const SCRIPTS: ScriptCard[] = [
    {
        id: 'replace-bmc-username',
        name: 'Replace BuyMeACoffee Username',
        description:
            'Scans all products and replaces a BuyMeACoffee username in checkout links. ' +
            'The checkout token UUID is preserved. Example: /cortniemartens/extras/checkout/TOKEN → /tonidavis/extras/checkout/TOKEN',
        danger: false,
        params: {
            fromUsername: 'cortniemartens',
            toUsername: 'tonidavis',
        },
        paramLabels: {
            fromUsername: 'Replace username',
            toUsername: 'With username',
        },
    },
    {
        id: 'bulk-update-checkout-flow',
        name: 'Bulk Update Checkout Flow',
        description:
            'Changes the checkout_flow field for all matching products. ' +
            'Checkout links are NEVER modified — existing BMC/Ko-fi links remain intact. ' +
            'Use "All flows" to update every product regardless of current flow.',
        danger: false,
        params: {
            fromFlow: 'buymeacoffee',
            toFlow: 'stripe',
        },
        paramLabels: {
            fromFlow: 'Change products currently on',
            toFlow: 'Switch their flow to',
        },
        paramOptions: {
            fromFlow: ['all', ...CHECKOUT_FLOWS],
            toFlow: CHECKOUT_FLOWS,
        },
        paramOptionLabels: {
            fromFlow: {
                all: 'All flows',
                buymeacoffee: '☕ Buy Me a Coffee',
                stripe: '💳 Stripe',
                kofi: '☕ Ko-fi',
                external: '🔗 External',
                'paypal-invoice': '🔵 PayPal Invoice/Request (Telegram Chat)',
                'paypal-unclaimed': '🔵 PayPal Unclaimed',
                'paypal-direct': '🔵 PayPal Checkout Direct',
            },
            toFlow: {
                buymeacoffee: '☕ Buy Me a Coffee',
                stripe: '💳 Stripe',
                kofi: '☕ Ko-fi',
                external: '🔗 External',
                'paypal-invoice': '🔵 PayPal Invoice/Request (Telegram Chat)',
                'paypal-unclaimed': '🔵 PayPal Unclaimed',
                'paypal-direct': '🔵 PayPal Checkout Direct',
            },
        },
    },
    {
        id: 'bulk-mark-sold-out',
        name: 'Bulk Update Product Availability',
        description:
            'Mark products as sold out or back as available in bulk. ' +
            'Use "Matching only" to only affect products that need changing (recommended), or "All products" to update everything.',
        danger: true,
        params: {
            action: 'mark_sold_out',
            targetFilter: 'matching_only',
        },
        paramLabels: {
            action: 'Action',
            targetFilter: 'Apply to',
        },
        paramOptions: {
            action: ['mark_sold_out', 'mark_available'],
            targetFilter: ['matching_only', 'all'],
        },
        paramOptionLabels: {
            action: { mark_sold_out: '🔴 Mark as sold out', mark_available: '🟢 Mark as available' },
            targetFilter: { matching_only: 'Matching products only (recommended)', all: 'All products' },
        },
    },
    {
        id: 'bulk-assign-seller-by-admin',
        name: 'Bulk Assign Seller by Admin',
        description:
            'Finds all products listed by a specific admin and assigns them to a public seller. ' +
            'Sets the seller_id field on every matching product. ' +
            'Enter the seller\'s username (e.g. official-deeldepot) or their database ID. ' +
            'Use Preview first to see how many products will be affected before running.',
        danger: false,
        params: {
            listedBy: 'walid',
            sellerId: '',
        },
        paramLabels: {
            listedBy: 'Listed by (admin name)',
            sellerId: 'Seller username or ID',
        },
        paramPlaceholders: {
            sellerId: 'e.g. official-deeldepot',
        },
        paramOptions: {
            listedBy: LISTED_BY_ADMINS,
        },
        paramOptionLabels: {
            listedBy: Object.fromEntries(LISTED_BY_ADMINS.map(n => [n, n])),
        },
    },
    {
        id: 'bulk-assign-unassigned-seller',
        name: 'Bulk Assign Unassigned Products to Seller',
        description:
            'Finds all products that have NO public seller assigned (seller_id is null/empty) and assigns them to the specified public seller. ' +
            'Sets the seller_id field on every matching product. ' +
            'Enter the seller\'s username (e.g. official-deeldepot) or their database ID. ' +
            'Use Preview first to see how many products will be affected before running.',
        danger: false,
        params: {
            sellerId: '',
        },
        paramLabels: {
            sellerId: 'Assign to Seller username or ID',
        },
        paramPlaceholders: {
            sellerId: 'e.g. official-deeldepot',
        },
    },
];


// ─── Single script card component ─────────────────────────────────────────────
function ScriptCardComponent({ script }: { script: ScriptCard }) {
    const [state, setState] = useState<RunState>('idle');
    const [params, setParams] = useState<Record<string, string>>(script.params);
    const [response, setResponse] = useState<ScriptRunResponse | null>(null);
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    const callApi = async (dryRun: boolean) => {
        setState(dryRun ? 'previewing' : 'running');
        setError('');

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/scripts/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ scriptId: script.id, dryRun, params }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Script failed');
            }

            setResponse(data);
            setState(dryRun ? 'preview_ready' : 'done');
            setShowResults(true);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
            setState('error');
        }
    };

    const handlePreview = () => callApi(true);
    const handleRun = () => {
        if (!confirm(`⚠️ This will update ${response?.affected ?? '?'} products in the database.\n\nAre you sure you want to proceed?`)) return;
        callApi(false);
    };
    const handleReset = () => {
        setState('idle');
        setResponse(null);
        setError('');
        setShowResults(false);
    };

    const isBusy = state === 'previewing' || state === 'running';

    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${script.danger ? 'border-red-200' : 'border-gray-100'
            }`}>
            {/* Card Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${script.danger
                            ? 'bg-red-50 text-red-600'
                            : 'bg-[#090A28]/10 text-[#090A28]'
                            }`}>
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#262626] text-base">{script.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{script.description}</p>
                        </div>
                    </div>

                    {(state === 'done' || state === 'error' || state === 'preview_ready') && (
                        <button
                            onClick={handleReset}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Reset"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Params */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(script.paramLabels).map(([key, label]) => {
                        const options = script.paramOptions?.[key];
                        return (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                                {options ? (
                                    <select
                                        value={params[key] || ''}
                                        onChange={(e) => setParams((prev) => ({ ...prev, [key]: e.target.value }))}
                                        disabled={isBusy || state === 'done'}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent disabled:opacity-60"
                                    >
                                        {options.map(opt => {
                                            const label = script.paramOptionLabels?.[key]?.[opt] ?? opt;
                                            return <option key={opt} value={opt}>{label}</option>;
                                        })}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={params[key] || ''}
                                        onChange={(e) => setParams((prev) => ({ ...prev, [key]: e.target.value }))}
                                        disabled={isBusy || state === 'done'}
                                        placeholder={script.paramPlaceholders?.[key] || ''}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-transparent disabled:opacity-60"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50/50 flex flex-wrap items-center gap-3">
                {/* Preview button */}
                {(state === 'idle' || state === 'error') && (
                    <button
                        onClick={handlePreview}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Eye className="h-4 w-4" />
                        Preview Changes
                    </button>
                )}

                {/* Previewing spinner */}
                {state === 'previewing' && (
                    <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-sm font-medium">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Previewing...
                    </button>
                )}

                {/* After preview: re-preview + run */}
                {state === 'preview_ready' && (
                    <>
                        <button
                            onClick={handlePreview}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Re-preview
                        </button>
                        <button
                            onClick={handleRun}
                            disabled={!response || response.affected === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#090A28] text-white rounded-xl hover:bg-[#1c2070] transition-colors text-sm font-medium shadow-lg shadow-[#090A28]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="h-4 w-4" />
                            Run Script ({response?.affected ?? 0} products)
                        </button>
                    </>
                )}

                {/* Running spinner */}
                {state === 'running' && (
                    <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-[#090A28] text-white rounded-xl text-sm font-medium opacity-75">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Running...
                    </button>
                )}

                {/* Done */}
                {state === 'done' && (
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        {response?.message}
                    </div>
                )}

                {/* Error */}
                {state === 'error' && (
                    <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                        <XCircle className="h-5 w-5 text-red-500" />
                        {error}
                    </div>
                )}
            </div>

            {/* Results table */}
            {response && response.results.length > 0 && (
                <div className="border-t border-gray-100">
                    <button
                        onClick={() => setShowResults((v) => !v)}
                        className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <span>
                            {state === 'done'
                                ? `${response.results.filter((r) => r.updated).length} updated`
                                : `${response.affected} product${response.affected !== 1 ? 's' : ''} would be affected`}
                        </span>
                        {showResults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showResults && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-t border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                        {'oldSellerId' in (response.results[0] ?? {}) ? (
                                            <>
                                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Previous Seller</th>
                                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">New Seller ID</th>
                                            </>
                                        ) : 'oldFlow' in (response.results[0] ?? {}) ? (
                                            <>
                                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Old Flow</th>
                                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">New Flow</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Old Link</th>
                                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">New Link</th>
                                            </>
                                        )}
                                        {state === 'done' && (
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {response.results.map((row) => (
                                        <tr key={row.slug} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-[#262626]">{row.title}</div>
                                                <div className="text-xs text-gray-400">{row.slug}</div>
                                            </td>
                                            {'oldSellerId' in row ? (
                                            <>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                                        {row.oldSellerId || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2 py-0.5 bg-[#090A28]/10 text-[#090A28] rounded text-xs font-mono">
                                                        {row.newSellerId}
                                                    </span>
                                                </td>
                                            </>
                                        ) : 'oldFlow' in row ? (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{row.oldFlow}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-0.5 bg-[#090A28]/10 text-[#090A28] rounded text-xs font-mono">{row.newFlow}</span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[200px] truncate" title={row.oldLink}>
                                                        {row.oldLink}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#090A28] font-mono text-xs max-w-[200px] truncate" title={row.newLink}>
                                                        {row.newLink}
                                                    </td>
                                                </>
                                            )}
                                            {state === 'done' && (
                                                <td className="px-4 py-3">
                                                    {row.updated ? (
                                                        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Updated
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                                                            <XCircle className="h-3.5 w-3.5" /> Failed
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* No products affected */}
            {response && response.affected === 0 && (
                <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-2 text-gray-500 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    No products matched — nothing to update.
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminScriptsPage() {
    const [adminRole, setAdminRole] = useState<string | null>(null);

    useEffect(() => {
        const role = document.cookie
            .split('; ')
            .find(row => row.startsWith('admin_role='))
            ?.split('=')[1];
        setAdminRole(role || '');
    }, []);

    const isSuperAdmin = adminRole === 'SUPER_ADMIN';

    return (
        <AdminLayout
            title="Scripts"
            subtitle="Run automated database maintenance scripts."
        >
            {/* Still loading role — show nothing yet */}
            {adminRole === null ? null : !isSuperAdmin ? (
                /* ─── Restricted access screen ─── */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                        <ShieldOff className="h-10 w-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-[#262626] mb-2">Super Admin Only</h2>
                    <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                        The <strong>Scripts</strong> section is restricted to <strong>Super Admin</strong> accounts only.
                        Please contact a Super Admin if you need a script to be run.
                    </p>
                </div>
            ) : (
                /* ─── Super Admin content ─── */
                <>
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Important:</strong> Always use <strong>Preview Changes</strong> first to review which products will be affected before running a script. Scripts modify the database directly and cannot be automatically undone.
                        </div>
                    </div>
                    <div className="space-y-6">
                        {SCRIPTS.map((script) => (
                            <ScriptCardComponent key={script.id} script={script} />
                        ))}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
