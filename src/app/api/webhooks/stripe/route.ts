import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    try {
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
    console.log('[Stripe Webhook] Customer email:', session.customer_email);
    console.log('[Stripe Webhook] Payment status:', session.payment_status);

    // Here you could:
    // - Save order to database
    // - Send confirmation email
    // - Update inventory
    // - Trigger fulfillment
}

// Handle expired checkout sessions (IMPORTANT for your issue)
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] ✅ Checkout session EXPIRED (auto-cleaned):', session.id);
    console.log('[Stripe Webhook] Metadata:', session.metadata);

    // The session is already expired by Stripe
    // No incomplete transaction will remain in the dashboard
    // This log helps you track abandoned carts for analytics

    // Optional: Track abandoned carts
    if (session.metadata) {
        console.log('[Stripe Webhook] Abandoned cart:', {
            product_slug: session.metadata.product_slug,
            customer_email: session.metadata.customer_email || session.customer_email,
            expired_at: new Date().toISOString(),
        });
    }
}

// Handle async payment success (e.g., some payment methods take time)
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] Async payment succeeded:', session.id);
    // Handle similar to checkout.session.completed
}

// Handle async payment failure
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
    console.log('[Stripe Webhook] Async payment failed:', session.id);
    console.log('[Stripe Webhook] Customer should be notified');

    // Optional: Send email to customer about failed payment
}

// Handle payment intent failure
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('[Stripe Webhook] Payment failed:', paymentIntent.id);
    console.log('[Stripe Webhook] Failure reason:', paymentIntent.last_payment_error?.message);

    // Optional: Log payment failures for analytics
}
