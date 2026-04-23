"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { MapPin, Mail, ShieldCheck, Clock, ChevronDown, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

declare global {
    interface Window {
        HFChatConfig?: {
            chatUrl: string;
            target: string;
            customerName: string;
            customerEmail: string;
            orderId: string;
            total: string;
        };
        __hfChatScriptPromise?: Promise<void>;
        __hfChatScriptLoaded?: boolean;
    }
}

const CHAT_WIDGET_SRC = 'https://chatapppay.vercel.app/widget.js';
const CHAT_WIDGET_SCRIPT_ID = 'hf-chat-widget-script';

function clearChatTargets() {
    if (typeof document === 'undefined') return;

    ['chat-widget-mobile', 'chat-widget-desktop'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
}

function loadChatWidgetScript(forceReload: boolean = false): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.resolve();
    }

    if (forceReload) {
        const existingScript = document.getElementById(CHAT_WIDGET_SCRIPT_ID);
        if (existingScript?.parentNode) {
            existingScript.parentNode.removeChild(existingScript);
        }
        window.__hfChatScriptLoaded = false;
        window.__hfChatScriptPromise = undefined;
    }

    if (window.__hfChatScriptLoaded) {
        return Promise.resolve();
    }

    if (window.__hfChatScriptPromise) {
        return window.__hfChatScriptPromise;
    }

    window.__hfChatScriptPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.getElementById(CHAT_WIDGET_SCRIPT_ID) as HTMLScriptElement | null;

        if (existingScript) {
            if ((existingScript as any).dataset.loaded === 'true') {
                window.__hfChatScriptLoaded = true;
                resolve();
                return;
            }

            existingScript.addEventListener('load', () => {
                existingScript.dataset.loaded = 'true';
                window.__hfChatScriptLoaded = true;
                resolve();
            }, { once: true });

            existingScript.addEventListener('error', () => {
                window.__hfChatScriptPromise = undefined;
                reject(new Error('Failed to load chat widget script'));
            }, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = CHAT_WIDGET_SCRIPT_ID;
        script.src = CHAT_WIDGET_SRC;
        script.async = true;
        script.onload = () => {
            script.dataset.loaded = 'true';
            window.__hfChatScriptLoaded = true;
            resolve();
        };
        script.onerror = () => {
            window.__hfChatScriptPromise = undefined;
            reject(new Error('Failed to load chat widget script'));
        };

        document.body.appendChild(script);
    });

    return window.__hfChatScriptPromise;
}

interface PaypalInvoiceConfirmationProps {
    shippingData: {
        streetAddress: string;
        city: string;
        state: string;
        zipCode: string;
        email: string;
    };
    product: {
        title: string;
        price: number;
        currency?: string;
        images?: string[];
    };
    sellerName?: string | null;
    orderId?: string | null;
    variant?: 'invoice' | 'unclaimed';
    onClose?: () => void;
}

export default function PaypalInvoiceConfirmation({
    shippingData,
    product,
    sellerName,
    orderId,
    variant = 'invoice',
    onClose
}: PaypalInvoiceConfirmationProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [payeeEmail, setPayeeEmail] = useState('heydeeldepot@gmail.com');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [proofSubmitted, setProofSubmitted] = useState(false);
    const [proofError, setProofError] = useState('');
    const currencySymbol = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';
    const orderTotal = `${currencySymbol}${product.price.toFixed(2)}`;
    const isUnclaimed = variant === 'unclaimed';

    const customerName = shippingData.email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Customer';

    const widgetOrderId = useRef(`ORD-${Date.now().toString(36).toUpperCase()}`).current;
    const lastTargetRef = useRef<string | null>(null);

    const address = [shippingData.streetAddress, shippingData.city, shippingData.state, shippingData.zipCode]
        .filter(Boolean).join(', ');

    useEffect(() => {
        if (!isUnclaimed || typeof window === 'undefined') return;

        fetch(`/api/payment-settings/paypal-direct?t=${Date.now()}`)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data?.payeeEmail) {
                    setPayeeEmail(data.payeeEmail);
                }
            })
            .catch((error) => {
                console.error('❌ [PayPal Unclaimed] Failed to fetch payee email:', error);
            });
    }, [isUnclaimed]);

    useEffect(() => {
        if (isUnclaimed) return;
        if (typeof window === 'undefined') return;

        const updateViewportMode = () => {
            setIsMobileViewport(window.innerWidth < 1024);
        };

        updateViewportMode();
        window.addEventListener('resize', updateViewportMode);

        return () => {
            window.removeEventListener('resize', updateViewportMode);
        };
    }, []);

    useEffect(() => {
        if (isUnclaimed) return;
        if (typeof window === 'undefined') return;

        const targetId = isMobileViewport ? '#chat-widget-mobile' : '#chat-widget-desktop';
        const targetChanged = lastTargetRef.current !== null && lastTargetRef.current !== targetId;
        lastTargetRef.current = targetId;

        window.HFChatConfig = {
            chatUrl: 'https://chatapppay.vercel.app',
            target: targetId,
            customerName,
            customerEmail: shippingData.email,
            orderId: widgetOrderId,
            total: orderTotal,
        };

        if (targetChanged) {
            clearChatTargets();
        }

        loadChatWidgetScript(targetChanged).catch((error) => {
            console.error('❌ [PayPal Invoice Chat] Widget bootstrap failed:', error);
        });

        return () => {
            delete window.HFChatConfig;
            clearChatTargets();
        };
    }, [customerName, shippingData.email, widgetOrderId, orderTotal, isMobileViewport, isUnclaimed]);

    const handleProofUpload = async () => {
        if (!proofFile) {
            setProofError('Please upload your PayPal proof screenshot first.');
            return;
        }

        if (!orderId) {
            setProofError('We could not find your order reference. Please restart checkout.');
            return;
        }

        setUploadingProof(true);
        setProofError('');

        try {
            const formData = new FormData();
            formData.append('file', proofFile);
            formData.append('orderId', orderId);
            formData.append('payerEmail', shippingData.email);
            formData.append('payeeEmail', payeeEmail);
            formData.append('amount', String(product.price));
            formData.append('currency', product.currency || 'USD');

            const response = await fetch('/api/paypal-unclaimed/upload-proof', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.error || 'Failed to upload proof');
            }

            setProofSubmitted(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload proof';
            setProofError(message);
        } finally {
            setUploadingProof(false);
        }
    };

    if (isUnclaimed) {
        return (
            <div className="min-h-screen bg-[#f6f7fb] py-6 sm:py-10 px-4">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-5">
                        <button
                            onClick={onClose}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#090A28] transition-colors"
                        >
                            <span className="text-lg leading-none">←</span>
                            Back to checkout
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
                        <div className="rounded-[28px] border border-[#e8ebf3] bg-white shadow-[0_20px_80px_rgba(9,10,40,0.08)] overflow-hidden">
                            <div className="border-b border-[#eef1f6] bg-gradient-to-r from-[#003087] to-[#0070ba] px-6 py-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/15 overflow-hidden">
                                        <Image src="/paypal.png" alt="PayPal" width={100} height={32} className="h-8 w-auto object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Stage 2</p>
                                        <h1 className="mt-1 text-2xl font-bold leading-tight">PayPal Unclaimed Payment</h1>
                                        <p className="mt-1 text-sm text-blue-100">Send the exact amount, then upload your proof below.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6 sm:px-8 sm:py-8">
                                {proofSubmitted ? (
                                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                                                <CheckCircle2 className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-emerald-900">Proof received successfully</h2>
                                                <p className="mt-2 text-sm leading-7 text-emerald-900/85">
                                                    Our DeelDepot payment team has confirmed your order, further confirmation email will be sent to you shortly.
                                                </p>
                                                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                                                    Order reference: {orderId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-[#e9edf4] bg-[#fbfcff] p-5">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Send To</p>
                                                <p className="mt-2 break-all text-lg font-bold text-[#090A28]">{payeeEmail}</p>
                                            </div>
                                            <div className="rounded-2xl border border-[#e9edf4] bg-[#fbfcff] p-5">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Exact Amount</p>
                                                <p className="mt-2 text-3xl font-extrabold text-[#090A28]">{orderTotal}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-3xl border border-[#e9edf4] bg-[#fbfcff] p-5 sm:p-6">
                                            <h2 className="text-lg font-bold text-[#262626]">What to do now</h2>
                                            <div className="mt-4 space-y-4">
                                                {[
                                                    `Go to your PayPal account and send exactly ${orderTotal} to ${payeeEmail}.`,
                                                    'Take a screenshot of the payment proof after sending it.',
                                                    'Upload the screenshot below so our payment team can verify your order.'
                                                ].map((text, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#090A28] text-sm font-bold text-white">
                                                            {index + 1}
                                                        </div>
                                                        <p className="text-sm leading-7 text-gray-600">{text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-3xl border border-dashed border-[#b9c3d7] bg-white p-5 sm:p-6">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f7fb] text-[#090A28]">
                                                    <Upload className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-base font-bold text-[#262626]">Upload proof of payment</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Accepted: JPG, PNG, WEBP, GIF. Max 10MB.</p>
                                                </div>
                                            </div>

                                            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-[#d8dfea] bg-[#fafbff] px-6 py-8 text-center transition-colors hover:border-[#003087]/35 hover:bg-[#f3f7ff]">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setProofFile(file);
                                                        setProofError('');
                                                    }}
                                                />
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                                                    <Upload className="h-5 w-5 text-[#003087]" />
                                                </div>
                                                <p className="mt-4 text-sm font-semibold text-[#090A28]">
                                                    {proofFile ? proofFile.name : 'Choose your screenshot proof'}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">Tap here to browse and upload your payment proof.</p>
                                            </label>

                                            {proofError && (
                                                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                    <span>{proofError}</span>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleProofUpload}
                                                disabled={!proofFile || uploadingProof}
                                                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#F5970C] px-5 py-4 text-base font-bold text-white shadow-[0_12px_30px_rgba(245,151,12,0.28)] transition-all hover:bg-[#e28b09] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                                            >
                                                {uploadingProof ? 'Uploading proof...' : 'Upload proof and confirm'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-[28px] border border-[#e8ebf3] bg-white p-6 shadow-[0_18px_50px_rgba(9,10,40,0.05)]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Order Summary</p>
                                <h2 className="mt-3 text-xl font-bold text-[#262626]">{product.title}</h2>
                                {sellerName && (
                                    <div className="mt-4 rounded-2xl bg-[#f7f8fc] px-4 py-3 text-sm text-gray-600">
                                        Sold by <span className="font-bold text-[#090A28]">{sellerName}</span>
                                    </div>
                                )}
                                <div className="mt-5 space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center justify-between">
                                        <span>Buyer email</span>
                                        <span className="font-semibold text-[#262626] break-all text-right">{shippingData.email}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Delivery</span>
                                        <span className="font-semibold text-[#262626] text-right">
                                            {[shippingData.streetAddress, shippingData.city, shippingData.state, shippingData.zipCode].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#edf1f6] pt-3">
                                        <span className="font-semibold text-[#262626]">Total due</span>
                                        <span className="text-xl font-extrabold text-[#090A28]">{orderTotal}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[#e8ebf3] bg-white p-6 shadow-[0_18px_50px_rgba(9,10,40,0.05)]">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#003087]">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[#262626]">Payment note</h3>
                                        <p className="mt-2 text-sm leading-7 text-gray-600">
                                            Use the exact amount shown above and upload a clear screenshot after paying. That proof is what our team will use to process this order.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ═══════════════════════════════════════
                MOBILE  (< lg)  — full-screen chat UX
                No page scroll. Chat fills the screen.
            ═══════════════════════════════════════ */}
            <div className="lg:hidden fixed inset-0 z-[9999] bg-gray-50 flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>

                {/* Sticky compact top bar */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
                    <button
                        onClick={() => setDetailsOpen(o => !o)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left"
                    >
                        <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <Image src="/paypal-incoice.webp" alt="PayPal" width={24} height={24} className="w-6 h-6 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#262626] leading-tight">Order Reserved</p>
                            <p className="text-xs text-gray-500 truncate">{shippingData.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                            <span className="text-base font-extrabold text-[#090A28]">{orderTotal}</span>
                            <ChevronDown
                                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${detailsOpen ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </button>

                    {/* Expandable order details */}
                    {detailsOpen && (
                        <div className="px-4 pb-3 border-t border-gray-100">
                            <div className="mt-3 bg-blue-50 rounded-xl p-3 space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-[#090A28] flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-xs leading-snug">{address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-[#090A28] flex-shrink-0" />
                                    <span className="text-[#090A28] text-xs font-medium break-all">{shippingData.email}</span>
                                </div>
                                {sellerName && (
                                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-blue-100/50">
                                        <span className="text-[#090A28] text-xs font-medium opacity-90 text-left">Sold by: {sellerName}</span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 pl-5">
                                    A PayPal invoice will be sent here once confirmed.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat fills all remaining screen height — no page scroll */}
                <div id="chat-widget-mobile" className="flex-1" style={{ overflow: 'hidden' }} />
            </div>

            {/* ═══════════════════════════════════════
                DESKTOP  (lg+)  — centered two-column card
            ═══════════════════════════════════════ */}
            <div className="hidden lg:flex min-h-screen bg-gray-50 items-start justify-center py-10 px-4">
                {/* Centered card: max-w-5xl, split 50/50 */}
                <div
                    className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-gray-100 flex overflow-hidden"
                    style={{ minHeight: '80vh' }}
                >
                    {/* ── Left: order summary (50%) ── */}
                    <div className="w-1/2 flex-shrink-0 border-r border-gray-100 flex flex-col">
                        <div className="h-1 w-full bg-[#090A28]" />
                        <div className="p-8 flex flex-col flex-1">

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    <Image src="/paypal-incoice.webp" alt="PayPal" width={28} height={28} className="w-7 h-7 object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold text-[#262626] leading-tight">Order Reserved</h1>
                                    <p className="text-xs text-gray-500 mt-0.5">Chat with our team to complete your purchase</p>
                                </div>
                            </div>

                            {sellerName && (
                                <div className="bg-gray-50 text-[#262626] rounded-xl px-4 py-3 flex items-center justify-between mb-4 border border-gray-100">
                                    <span className="text-sm font-medium opacity-80">Sold by</span>
                                    <span className="text-sm font-bold text-[#090A28]">{sellerName}</span>
                                </div>
                            )}

                            <div className="bg-[#090A28] text-white rounded-xl px-4 py-3 flex items-center justify-between mb-5">
                                <span className="text-sm font-medium opacity-80">Order Total</span>
                                <span className="text-xl font-extrabold">{orderTotal}</span>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3 text-sm mb-5">
                                <p className="text-xs font-semibold text-[#090A28] uppercase tracking-wide mb-1">Delivery Details</p>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-[#090A28] flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 leading-snug">{address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-[#090A28] flex-shrink-0" />
                                    <span className="text-[#090A28] font-medium break-all">{shippingData.email}</span>
                                </div>
                                <p className="text-xs text-gray-500 pl-6">A PayPal invoice will be sent here once confirmed.</p>
                            </div>

                            <div className="flex flex-col space-y-3 mb-6">
                                {[
                                    { icon: '💬', text: 'Chat with our team to confirm your order' },
                                    { icon: '📧', text: 'Receive a PayPal invoice by email' },
                                    { icon: '✅', text: 'Pay via PayPal and we ship your order' },
                                ].map(({ icon, text }, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-base">{icon}</div>
                                        <span className="text-sm text-gray-600">{text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-100 mb-5">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#090A28]" />
                                    <span>Secured with SSL encryption</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock className="h-3.5 w-3.5 text-[#090A28]" />
                                    <span>Average response time: under 2 minutes</span>
                                </div>
                            </div>

                            <p className="mt-3 text-center text-xs text-gray-400">
                                Questions?{' '}
                                <a href="mailto:support@DeelDepot.com" className="text-[#090A28] hover:underline">support@DeelDepot.com</a>
                            </p>
                        </div>
                    </div>

                    {/* ── Right: chat widget (50%) ── */}
                    <div className="w-1/2 flex flex-col">
                        <div id="chat-widget-desktop" className="flex-1" style={{ overflow: 'hidden' }} />
                    </div>
                </div>
            </div>
        </>
    );
}
