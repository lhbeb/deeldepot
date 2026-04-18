"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { AlertCircle, Loader2 } from 'lucide-react';

interface PaypalInlineButtonProps {
  /** Called before createOrder — run validation + save order. Return false to abort. */
  onBeforePayment: () => Promise<{ ok: boolean; payeeEmail: string; amount: number; currency: string; description: string }>;
  onSuccess: () => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  /** Unique DOM id for the PayPal button container. Must be unique per mounted instance. */
  containerId?: string;
  currency?: string;
  clientId?: string;
}

/**
 * Renders the PayPal SDK buttons inline inside the checkout form.
 * Clicking them triggers the full checkout: validation → save order → PayPal payment.
 * No extra steps or modals needed.
 */
const PaypalInlineButton: React.FC<PaypalInlineButtonProps> = ({
  onBeforePayment,
  onSuccess,
  onError,
  disabled,
  containerId = 'paypal-inline-button-container',
  currency = 'USD',
  clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb',
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonsRef = useRef(false);

  // Keep latest callbacks in refs to avoid stale closures
  // since PayPal SDK initialization only happens once
  const onBeforePaymentRef = useRef(onBeforePayment);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onBeforePaymentRef.current = onBeforePayment;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onBeforePayment, onSuccess, onError]);

  // If SDK was already loaded (e.g. hot reload / page revisit), set ready immediately
  useEffect(() => {
    if ((window as any).paypal) {
      setSdkReady(true);
    }
  }, []);

  // Fetch global payee email & render buttons once SDK is ready
  useEffect(() => {
    if (!sdkReady || buttonsRef.current) return;

    const win = window as any;
    if (!win.paypal) {
      setError('PayPal SDK unavailable. Please refresh.');
      return;
    }

    buttonsRef.current = true;

    try {
      win.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
          tagline: false,
        },

        // Called when the button is clicked, BEFORE the popup opens
        onClick: async (_data: any, actions: any) => {
          if (disabled) return actions.reject();

          try {
            const result = await onBeforePaymentRef.current();
            if (!result.ok) {
              return actions.reject(); // Silently aborts if validation fails (user sees the alert())
            }
            // Store result for createOrder
            (window as any).__paypal_payment_data = result;
            return actions.resolve();
          } catch (e) {
            console.error('❌ [PayPal] onClick error:', e);
            return actions.reject();
          }
        },

        // Called to actually construct the PayPal order
        createOrder: (_data: any, actions: any) => {
          const result = (window as any).__paypal_payment_data;
          if (!result || !result.ok) throw new Error('Payment data missing');

          const purchaseUnit: any = {
            description: result.description ? result.description.substring(0, 127) : 'Order details',
            amount: {
              currency_code: result.currency || 'USD',
              value: Number(result.amount).toFixed(2),
            },
          };

          if (result.payeeEmail && result.payeeEmail.trim() !== '') {
            purchaseUnit.payee = {
              email_address: result.payeeEmail.trim(),
            };
          }

          // Create the PayPal order using the JS SDK
          return actions.order.create({
            purchase_units: [purchaseUnit],
          });
        },

        onApprove: async (_data: any, actions: any) => {
          const details = await actions.order.capture();
          console.log('✅ [PayPal] Payment captured:', details);
          onSuccessRef.current();
        },

        onError: (err: any) => {
          console.error('❌ [PayPal] SDK error:', err);
          const msg = 'PayPal encountered an error. Please try again.';
          setError(msg);
          if (onErrorRef.current) onErrorRef.current(msg);
        },

        onCancel: () => {
          console.log('ℹ️ [PayPal] Cancelled by user');
        },

      }).render(`#${containerId}`);

      setRendered(true);
    } catch (err) {
      console.error('❌ [PayPal] Failed to initialize buttons:', err);
      buttonsRef.current = false;
      setError('Could not load PayPal. Please refresh and try again.');
    }
  }, [sdkReady, disabled]); // Removed onBeforePayment, onSuccess, onError from deps so SDK never re-init

  return (
    <div className="w-full">
      {/* Loading state */}
      {!rendered && !error && (
        <div className="w-full flex items-center justify-center gap-2 py-4 bg-[#FFC439] rounded-xl text-[#1a1a1a] font-semibold text-sm opacity-80">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading PayPal...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="w-full flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">PayPal Error</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="underline font-bold mt-1 text-red-800"
            >
              Refresh page
            </button>
          </div>
        </div>
      )}

      {/* PayPal button container — always in DOM so SDK can render into it */}
      <div className={`w-full transition-opacity duration-300 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        <div
          id={containerId}
          className={`w-full ${rendered && !error ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
        />
      </div>

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`}
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
        onError={() => setError('Failed to load PayPal script. Check your connection.')}
      />
    </div>
  );
};

export default PaypalInlineButton;
