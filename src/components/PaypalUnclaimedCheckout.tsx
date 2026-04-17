"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ShippingData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  email: string;
}

interface PaypalUnclaimedCheckoutProps {
  product: {
    title: string;
    price: number;
    currency: string;
    payeeEmail: string;
  };
  shippingData: ShippingData;
  preloadedEmail?: string | null;  // Email pre-fetched by parent during address confirm
  onClose: () => void;
  onSuccess?: () => void;
}

const PaypalUnclaimedCheckout: React.FC<PaypalUnclaimedCheckoutProps> = ({
  product,
  shippingData,
  preloadedEmail,
  onClose,
  onSuccess
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  // If parent pre-fetched the email during the 2s confirm, use it immediately
  const [globalPayeeEmail, setGlobalPayeeEmail] = useState<string | null>(preloadedEmail ?? null);
  const [configFetched, setConfigFetched] = useState(!!preloadedEmail);
  const buttonsRendered = useRef(false);

  // Step 1: fetch global payee email from DB (skip if parent already pre-fetched it)
  useEffect(() => {
    if (preloadedEmail) return; // already have it
    const fetchGlobalConfig = async () => {
      try {
        const res = await fetch('/api/payment-settings/unclaimed');
        if (res.ok) {
          const data = await res.json();
          if (data.configured && data.payeeEmail) {
            console.log('🌍 [PayPal] Using global payee email:', data.payeeEmail);
            setGlobalPayeeEmail(data.payeeEmail);
          }
        }
      } catch (err) {
        console.error('❌ [PayPal] Error fetching global config:', err);
      } finally {
        // Mark config as fetched even on error so we can proceed with fallback
        setConfigFetched(true);
      }
    };
    fetchGlobalConfig();
  }, []);

  // Step 2: once BOTH the SDK is loaded AND config is fetched, render PayPal buttons
  useEffect(() => {
    if (!sdkReady || !configFetched || buttonsRendered.current) return;

    const win = window as any;
    if (!win.paypal) {
      setError("PayPal SDK failed to load. Please refresh.");
      return;
    }

    const resolvedEmail = globalPayeeEmail || product.payeeEmail;
    if (!resolvedEmail) {
      setError("Payment not configured. Please contact support.");
      return;
    }

    console.log('💳 [PayPal] Initializing buttons with payee:', resolvedEmail);

    try {
      buttonsRendered.current = true;

      win.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal'
        },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              description: product.title,
              amount: {
                currency_code: product.currency || 'USD',
                value: product.price.toFixed(2)
              },
              payee: {
                email_address: resolvedEmail
              }
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
          const details = await actions.order.capture();
          console.log('✅ PayPal Payment Successful:', details);
          setIsPaid(true);
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          console.error('❌ PayPal SDK Error:', err);
          setError("An error occurred with PayPal. Please try again.");
        }
      }).render('#paypal-button-container');

      setIsLoaded(true);
    } catch (err) {
      console.error('❌ Failed to initialize PayPal buttons:', err);
      buttonsRendered.current = false; // allow retry on re-render
      setError("Could not initialize PayPal. Please try again.");
    }
  }, [sdkReady, configFetched, globalPayeeEmail, product, onSuccess]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#090A28]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={!isPaid ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="bg-[#090A28] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-4" />
            </div>
            <h3 className="text-white font-bold">Secure Checkout</h3>
          </div>
          {!isPaid && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          )}
        </div>

        <div className="p-6">
          {!isPaid ? (
            <>
              {/* Product Info Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 line-clamp-2 pr-4">{product.title}</h4>
                  <span className="font-bold text-[#090A28] whitespace-nowrap">
                    {product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$'}
                    {product.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Free Express Delivery
                </div>
              </div>

              {/* PayPal Container */}
              <div className="min-h-[150px] relative">
                {!isLoaded && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 text-[#090A28] animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Connecting to PayPal...</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Payment Error</p>
                      <p className="text-xs text-red-700 mt-0.5">{error}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-bold text-red-800 underline mt-2"
                      >
                        Try Refreshing Page
                      </button>
                    </div>
                  </div>
                )}

                {/* Always keep in DOM — PayPal renders buttons into this element */}
                <div
                  id="paypal-button-container"
                  className={`transition-opacity duration-300 ${isLoaded && !error ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>

              <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4">Secure Encryption</p>
                <div className="flex items-center justify-center gap-4 opacity-40 grayscale">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-3" />
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-8 max-w-[240px] mx-auto">
                Thank you for your purchase. Your order is now being processed.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-[#090A28] text-white font-bold py-4 rounded-2xl hover:bg-[#1c2070] transition-colors shadow-lg shadow-[#090A28]/20"
              >
                Continue to Homepage
              </button>
            </div>
          )}
        </div>
      </div>

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=sb&currency=${product.currency || 'USD'}`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setError("PayPal SDK failed to load. Please check your connection.")}
      />
    </div>
  );
};

export default PaypalUnclaimedCheckout;
