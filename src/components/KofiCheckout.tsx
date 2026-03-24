"use client";

import React, { useState, useEffect } from 'react';
import { Check, MapPin, Mail, X } from 'lucide-react';

interface KofiCheckoutProps {
    checkoutLink: string;
    shippingData: {
        streetAddress: string;
        city: string;
        state: string;
        zipCode: string;
        email: string;
    };
    onClose?: () => void;
}

export default function KofiCheckout({ checkoutLink, shippingData, onClose }: KofiCheckoutProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);

        // Simulate loading delay
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        // Cleanup
        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f8fafc] to-[#f0fdfa] px-0 sm:px-2 pt-0 sm:pt-8 sm:pb-8 min-h-screen">
            <div className="bg-white/95 backdrop-blur-lg rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-0 sm:border border-gray-100 w-full max-w-5xl mx-auto transition-all duration-500">

                {/* Header with Address Confirmation */}
                <div className="p-6 sm:p-8 border-b border-gray-100">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex flex-col items-center flex-1">
                            <div className="flex flex-col items-center mb-2">
                                <span className="inline-flex items-center justify-center bg-blue-100 rounded-full p-2 mb-2">
                                    <Check className="h-7 w-7 text-[#090A28]" />
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#262626] tracking-tight text-center">
                                    Address Confirmed
                                </h2>
                            </div>
                            <p className="text-base sm:text-lg text-gray-700 text-center">
                                Complete your payment below
                            </p>
                        </div>
                    </div>

                    {/* Address Card */}
                    <div className="w-full flex flex-col lg:flex-row gap-4">
                        {/* Address Section - Left */}
                        <div className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-5 w-5 text-[#090A28]" />
                                <span className="font-semibold text-[#090A28] text-base">Confirmed Delivery Address</span>
                            </div>
                            <div className="text-gray-800 text-base whitespace-pre-line leading-relaxed">
                                {shippingData.streetAddress && <div>{shippingData.streetAddress}</div>}
                                {shippingData.city && <div>{shippingData.city}</div>}
                                {shippingData.state || shippingData.zipCode ? (
                                    <div>{shippingData.state}{shippingData.state && shippingData.zipCode ? ', ' : ''}{shippingData.zipCode}</div>
                                ) : null}
                            </div>
                        </div>


                    </div>
                </div>

                {/* Ko-fi Iframe Container */}
                <div className="p-0 sm:p-8">
                    <div className="relative w-full overflow-hidden" style={{ minHeight: '1330px' }}>
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-2xl">
                                <div className="w-12 h-12 border-4 border-[#090A28]/30 border-t-[#090A28] rounded-full animate-spin mb-4"></div>
                                <span className="text-base text-gray-700 font-medium">Loading payment form...</span>
                            </div>
                        )}

                        <iframe
                            src={checkoutLink}
                            className={`w-full rounded-none sm:rounded-2xl border-0 sm:border-2 border-gray-200 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'
                                }`}
                            style={{
                                height: '1640px', // Increased height to compensate for negative margin
                                minHeight: '1640px',
                                marginTop: '-210px', // Shift up to hide the top header/content
                                marginBottom: '-100px' // Shift container boundary up to hide bottom footer
                            }}
                            title="Ko-fi Payment"
                            allow="payment"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                            referrerPolicy="strict-origin-when-cross-origin"
                            loading="eager"
                            data-kofi-iframe="true"
                            data-payment-frame="kofi"
                            scrolling="no"
                        />
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-8 mb-8 sm:mt-10 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1">
                                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-[#090A28]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect width="18" height="12" x="3" y="8" rx="2" />
                                    <path d="M7 8V6a5 5 0 0 1 10 0v2" />
                                </svg>
                            </span>
                            <span className="whitespace-nowrap">Secure Payment</span>
                        </div>
                        <div className="text-gray-300">•</div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1">
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#090A28]" />
                            </span>
                            <span className="whitespace-nowrap">SSL Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
