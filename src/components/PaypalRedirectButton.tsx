"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface PaypalRedirectButtonProps {
  /** Called before redirect — run validation + save order. Return false to abort. */
  onBeforePayment: () => Promise<{ ok: boolean; payeeEmail: string; amount: number; currency: string; description: string }>;
  disabled?: boolean;
  className?: string;
}

/**
 * PayPal Standard Redirect Button.
 * Uses the identical design from the product page for brand consistency.
 * No Client ID required — redirects directly to PayPal via email.
 */
const PaypalRedirectButton: React.FC<PaypalRedirectButtonProps> = ({
  onBeforePayment,
  disabled,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      // 1. Run validation and save order to our DB (takes 1-3s)
      const result = await onBeforePayment();
      
      if (!result.ok) {
        setIsLoading(false);
        return; 
      }

      // 2. Build the PayPal URL and redirect immediately.
      // We use a GET redirect (window.location.href) rather than a form POST
      // because after an async await, the browser may have already started
      // destroying the React tree, making DOM form submissions unreliable.
      const params = new URLSearchParams({
        cmd: '_xclick',
        business: result.payeeEmail.trim(),
        item_name: result.description.substring(0, 127).trim(),
        amount: Number(result.amount).toFixed(2),
        currency_code: result.currency || 'USD',
        no_shipping: '1',
        no_note: '1',
        charset: 'UTF-8',
        return: `${window.location.origin}/thankyou`,
        cancel_return: `${window.location.origin}/checkout`,
        rm: '0',
      });

      const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
      console.log('🚀 [PayPal] Redirecting to PayPal:', paypalUrl);
      
      window.location.href = paypalUrl;

      // Safety reset in case navigation is blocked by the browser
      setTimeout(() => setIsLoading(false), 10000);

    } catch (error) {
      console.error("❌ [PayPal Redirect] Error:", error);
      alert("Something went wrong with the PayPal payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* PayPal Button — matches product page design exactly */}
      <button
        type="button"
        onClick={handlePayClick}
        disabled={disabled || isLoading}
        aria-label="Checkout with PayPal"
        className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 active:scale-[0.98]"
        style={{ backgroundColor: '#EFC154' }}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003087]" />
        ) : (
          <Image
            src="/PayPal-checkout.png"
            alt="PayPal Checkout"
            width={150}
            height={24}
            className="h-6 w-auto object-contain"
          />
        )}
      </button>

      {/* Security note — matches the product page style */}
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium tracking-wide">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 text-gray-400 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secure &amp; protected — pay instantly with your PayPal account
      </p>
    </div>
  );
};

export default PaypalRedirectButton;
