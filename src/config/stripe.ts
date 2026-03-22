// Stripe configuration
// This file ensures the Stripe publishable key is properly exposed to client components

export const stripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

// Validation
if (typeof window !== 'undefined' && !stripeConfig.publishableKey) {
    console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    console.error('Please add it to your .env.local file and restart the dev server');
}
