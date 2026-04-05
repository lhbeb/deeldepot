import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripe initialization deferred to POST request handling to avoid build-time crashes

// Helper function to sanitize Stripe errors for user-facing responses
function getSafeStripeError(error: any): string {
    // Log the actual error for debugging (server-side only)
    console.error('🚨 [Stripe Error Details]:', {
        type: error.type,
        code: error.code,
        message: error.message,
        raw: error.raw,
    });

    // Check for sensitive errors that should NOT be exposed to users
    const sensitiveErrors = [
        'api_key',
        'authentication',
        'invalid_request_error',
        'expired',
        'sk_live',
        'sk_test',
        'secret',
        'token',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const isSensitive = sensitiveErrors.some(sensitive => errorMessage.includes(sensitive));

    if (isSensitive) {
        // Return generic error for sensitive issues
        return 'Payment processing is temporarily unavailable. Please contact support at support@DeelDepot.com';
    }

    // For non-sensitive errors, we can show a slightly more specific message
    // but still avoid technical jargon
    if (error.type === 'card_error') {
        return 'There was an issue with your payment method. Please try a different card or contact support@DeelDepot.com';
    }

    // Generic fallback for any other errors
    return 'An error occurred during payment processing. Please contact support@DeelDepot.com';
}

export async function POST(request: NextRequest) {
    try {
        // Initialize Stripe inside the handler to defer until runtime (avoids Vercel build crash)
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover' as any,
        });

        const body = await request.json();
        const { product, shippingData } = body;

        // Validate required fields
        if (!product || !shippingData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate amount in cents (Stripe uses smallest currency unit)
        const amount = Math.round(product.price * 100);

        // Create a Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: (product.currency || 'USD').toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                product_id: product.id,
                product_slug: product.slug,
                product_title: product.title,
                customer_email: shippingData.email,
                shipping_address: `${shippingData.streetAddress}, ${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}`,
            },
            description: `Order for ${product.title}`,
            shipping: {
                name: shippingData.email.split('@')[0], // Use email username as name
                address: {
                    line1: shippingData.streetAddress,
                    city: shippingData.city,
                    state: shippingData.state,
                    postal_code: shippingData.zipCode,
                    country: 'US', // You might want to make this dynamic
                },
            },
            receipt_email: shippingData.email,
        });

        console.log('✅ Payment Intent created:', paymentIntent.id);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error: any) {
        // Get sanitized error message (hides sensitive API details)
        const safeErrorMessage = getSafeStripeError(error);

        return NextResponse.json(
            { error: safeErrorMessage },
            { status: 500 }
        );
    }
}
