// Stripe configuration
// This file provides access to the Stripe publishable key dynamically

export async function fetchStripePublishableKey(): Promise<string> {
    try {
        // If we are on the server, we might be able to read env directly as fallback
        // However, safest is to hit the API route to ensure DB-backed logic is used
        const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            
        const response = await fetch(`${baseUrl}/api/config/stripe`, {
            next: { revalidate: 60 } // Cache for 1 minute
        });
        
        if (!response.ok) {
            console.error('❌ Failed to fetch Stripe configuration');
            return '';
        }
        
        const data = await response.json();
        return data.publishableKey || '';
    } catch (error) {
        console.error('❌ Error fetching Stripe configuration:', error);
        return typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '') : '';
    }
}
