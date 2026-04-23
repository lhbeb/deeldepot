"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle, AlertCircle, X, Lock } from 'lucide-react';

interface ShippingData {
  streetAddress?: string;
  address?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  zipCode: string;
  state?: string;
  country?: string;
  email: string;
}

interface PaypalDirectCheckoutProps {
  product: {
    title: string;
    price: number;
    currency: string;
    payeeEmail: string;        // fallback if no global email
  };
  shippingData: ShippingData;
  preloadedEmail?: string | null;  // Platform email pre-fetched by parent
  orderId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * PayPal Direct Checkout via PayPal Standard email redirect.
 * No SDK or Client ID required — just the payee email.
 * Redirects buyer to paypal.com/cgi-bin/webscr with business=PAYEE_EMAIL.
 */
const PaypalDirectCheckout: React.FC<PaypalDirectCheckoutProps> = ({
  product,
  shippingData,
  preloadedEmail,
  orderId,
  onClose,
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalPayeeEmail, setGlobalPayeeEmail] = useState<string | null>(preloadedEmail ?? null);
  const [configFetched, setConfigFetched] = useState(!!preloadedEmail);

  // Fetch the platform PayPal email from DB if not pre-loaded
  useEffect(() => {
    if (preloadedEmail) return;
    fetch('/api/payment-settings/paypal-direct')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.payeeEmail) setGlobalPayeeEmail(data.payeeEmail);
      })
      .catch(err => console.error('❌ [PayPal Direct] Error fetching email:', err))
      .finally(() => setConfigFetched(true));
  }, [preloadedEmail]);

  const resolvedPayeeEmail = globalPayeeEmail || product.payeeEmail;
  const currencySymbol = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';

  const handlePayWithPayPal = () => {
    if (!resolvedPayeeEmail) {
      setError('Payment not configured. Please contact support.');
      return;
    }

    setIsRedirecting(true);

    const params = new URLSearchParams({
      cmd: '_xclick',
      business: resolvedPayeeEmail.trim(),
      item_name: product.title.substring(0, 127).trim(),
      amount: product.price.toFixed(2),
      currency_code: product.currency || 'USD',
      no_shipping: '1',
      no_note: '1',
      charset: 'UTF-8',
      return: `${window.location.origin}/thankyou`,
      cancel_return: `${window.location.origin}/checkout`,
      notify_url: `${window.location.origin}/api/paypal/ipn`,
      rm: '0',
    });

    if (orderId) {
      params.set('custom', orderId);
      params.set('invoice', orderId);
    }

    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
    console.log('🚀 [PayPal Direct] Redirecting to:', paypalUrl);
    window.location.href = paypalUrl;

    // Safety reset in case browser blocks navigation
    setTimeout(() => setIsRedirecting(false), 10000);
  };

  const isReady = configFetched || !!preloadedEmail;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#090A28]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={!isRedirecting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">

        {/* Header */}
        <div className="bg-[#003087] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .92-.706h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.774-4.553z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">PayPal Checkout</h3>
              <p className="text-blue-200 text-xs">Secure redirect to PayPal</p>
            </div>
          </div>
          {!isRedirecting && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Product Summary */}
          <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-gray-900 line-clamp-2 pr-4 text-sm">{product.title}</h4>
              <span className="font-bold text-[#090A28] whitespace-nowrap text-base">
                {currencySymbol}{product.price.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Free Express Delivery
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* CTA */}
          {!isReady ? (
            <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading payment info...</span>
            </div>
          ) : isRedirecting ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#003087]/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#003087] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">Connecting to PayPal…</p>
                <p className="text-xs text-gray-500 mt-1">Please wait, do not close this page.</p>
              </div>
            </div>
          ) : (
            <>
              {/* PayPal Button */}
              <button
                onClick={handlePayWithPayPal}
                disabled={!resolvedPayeeEmail}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-yellow-300/30"
                style={{ backgroundColor: '#EFC154' }}
                aria-label="Pay with PayPal"
              >
                <Image
                  src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                  alt="PayPal"
                  width={100}
                  height={26}
                  unoptimized={true}
                  className="h-5 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-[#003087] font-bold">Pay with PayPal</span>
              </button>

              {/* What to expect */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <p className="font-semibold mb-1">What happens next?</p>
                <p>You&apos;ll be securely redirected to PayPal to complete your payment. You can pay with your PayPal balance, card, or bank account.</p>
              </div>
            </>
          )}

          {/* Trust Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <Lock className="h-3 w-3 shrink-0" />
            Secure payment via PayPal — 256-bit SSL encryption
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaypalDirectCheckout;
