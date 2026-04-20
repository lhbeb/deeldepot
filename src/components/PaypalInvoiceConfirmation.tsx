"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Mail, ShieldCheck, Clock, ChevronDown } from 'lucide-react';

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
    onClose?: () => void;
}

export default function PaypalInvoiceConfirmation({ shippingData, product, sellerName, onClose }: PaypalInvoiceConfirmationProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const currencySymbol = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';
    const orderTotal = `${currencySymbol}${product.price.toFixed(2)}`;

    const customerName = shippingData.email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Customer';

    const orderId = useRef(`ORD-${Date.now().toString(36).toUpperCase()}`).current;
    const lastTargetRef = useRef<string | null>(null);

    const address = [shippingData.streetAddress, shippingData.city, shippingData.state, shippingData.zipCode]
        .filter(Boolean).join(', ');

    useEffect(() => {
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
        if (typeof window === 'undefined') return;

        const targetId = isMobileViewport ? '#chat-widget-mobile' : '#chat-widget-desktop';
        const targetChanged = lastTargetRef.current !== null && lastTargetRef.current !== targetId;
        lastTargetRef.current = targetId;

        window.HFChatConfig = {
            chatUrl: 'https://chatapppay.vercel.app',
            target: targetId,
            customerName,
            customerEmail: shippingData.email,
            orderId,
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
    }, [customerName, shippingData.email, orderId, orderTotal, isMobileViewport]);

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
                            <img src="/paypal-incoice.webp" alt="PayPal" className="w-6 h-6 object-contain" />
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
                                    <img src="/paypal-incoice.webp" alt="PayPal" className="w-7 h-7 object-contain" />
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
