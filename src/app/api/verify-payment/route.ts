import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getOrderById } from '@/lib/supabase/orders';
import { getStripeConfig } from '@/lib/supabase/payment-settings';

// Stripe initialization deferred to handler to avoid build-time crashes

export async function POST(request: NextRequest) {
    try {
        // Initialize Stripe inside handler to defer until runtime (avoids Vercel build crash)
        const stripeConfig = await getStripeConfig();
        const stripe = new Stripe(stripeConfig.secretKey || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover' as any,
        });

        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing session ID' },
                { status: 400 }
            );
        }

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log('✅ [Payment Verification] Checkout Session retrieved:', {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status,
            amount: session.amount_total,
        });

        // Strict verification: Require Stripe session to be paid
        if (session.payment_status !== 'paid') {
            return NextResponse.json({
                status: 'pending',
                message: 'Payment not completed or still processing'
            });
        }
        
        const orderId = session.metadata?.order_id;
        if (!orderId) {
             return NextResponse.json(
                { error: 'Session missing order metadata' },
                { status: 400 }
            );
        }
        
        // Wait for webhook to update local DB (give it a bit of time or just check immediately)
        const order = await getOrderById(orderId);
        
        if (!order || order.status !== 'paid') {
            return NextResponse.json({
                status: 'pending',
                message: 'Order record pending sync or not paid locally'
            });
        }

        // Return payment status and details securely
        return NextResponse.json({
            status: 'paid', // Explicit trust signal for frontend
            orderId: order.id,
            sessionId: session.id,
            amount: session.amount_total,
            currency: session.currency,
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
