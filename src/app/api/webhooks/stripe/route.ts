import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { updateOrderStripeStatus } from '@/lib/supabase/orders';

// Stripe initialization deferred to handler to avoid build-time crashes

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        // Initialize Stripe inside handler to defer until runtime (avoids Vercel build crash)
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover' as any,
        });

        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            console.error('[Stripe Webhook] No signature found');
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error('[Stripe Webhook] Signature verification failed:', err);
            return NextResponse.json(
                { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
                { status: 400 }
            );
        }

        console.log('[Stripe Webhook] Event received:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'checkout.session.expired':
                await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
                break;

            case 'checkout.session.async_payment_succeeded':
                await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);
                break;

            case 'checkout.session.async_payment_failed':
                await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
                break;

            case 'payment_intent.succeeded':
                console.log('[Stripe Webhook] Payment succeeded:', (event.data.object as Stripe.PaymentIntent).id);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            default:
                console.log('[Stripe Webhook] Unhandled event type:', event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Stripe Webhook] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

// Handle successful checkout completion
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] Checkout completed:', session.id);
    
    if (session.metadata?.order_id) {
        if (session.payment_status === 'paid') {
            const paymentIntentId = typeof session.payment_intent === 'string' 
                ? session.payment_intent 
                : session.payment_intent?.id;
                
            await updateOrderStripeStatus(session.metadata.order_id, {
                status: 'paid',
                stripe_payment_intent_id: paymentIntentId,
                stripe_payment_status: session.payment_status,
                paid_at: new Date().toISOString()
            });
            console.log('[Stripe Webhook] DB updated to PAID for order:', session.metadata.order_id);
        }
    }
}

// Handle expired checkout sessions
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] ✅ Checkout session EXPIRED:', session.id);
    
    if (session.metadata?.order_id) {
        await updateOrderStripeStatus(session.metadata.order_id, {
            status: 'expired'
        });
        console.log('[Stripe Webhook] DB updated to EXPIRED for order:', session.metadata.order_id);
    }
}

// Handle async payment success
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] Async payment succeeded:', session.id);
    if (session.metadata?.order_id) {
        await updateOrderStripeStatus(session.metadata.order_id, {
            status: 'paid',
            stripe_payment_status: 'paid',
            paid_at: new Date().toISOString()
        });
    }
}

// Handle async payment failure
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] Async payment failed:', session.id);
    if (session.metadata?.order_id) {
        await updateOrderStripeStatus(session.metadata.order_id, {
            status: 'payment_failed',
            stripe_payment_status: 'failed'
        });
    }
}

// Handle payment intent failure
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('[Stripe Webhook] Payment failed:', paymentIntent.id);
    console.log('[Stripe Webhook] Failure reason:', paymentIntent.last_payment_error?.message);
    
    // We typically handle failures via checkout.session.async_payment_failed
    // but this gives more detail
}
