import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripe initialization deferred to handler to avoid build-time crashes

export async function POST(request: NextRequest) {
    try {
        // Initialize Stripe inside handler to defer until runtime (avoids Vercel build crash)
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover' as any,
        });

        const { paymentIntentId } = await request.json();

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: 'Missing payment intent ID' },
                { status: 400 }
            );
        }

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        console.log('✅ [Payment Verification] Payment Intent retrieved:', {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
        });

        // Return payment status and details
        return NextResponse.json({
            status: paymentIntent.status,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
            created: paymentIntent.created,
        });

    } catch (error: any) {
        console.error('❌ [Payment Verification] Error:', error);

        // Don't expose Stripe errors to client
        return NextResponse.json(
            {
                error: 'Unable to verify payment. Please contact support if you completed a payment.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
