import { supabaseAdmin } from './server';

export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    mode: 'live' | 'test';
    isActive: boolean;
}

export interface PaypalConfig {
    payeeEmail: string;
}

/**
 * Fetches the active Stripe configuration from the database.
 * If not configured in the DB, it falls back to environment variables.
 * Caches the result in memory for 1 minute to prevent hammering the DB.
 */
let cachedConfig: StripeConfig | null = null;
let lastFetchTime = 0;

let cachedPaypalConfig: PaypalConfig | null = null;
let lastPaypalFetchTime = 0;

const CACHE_TTL = 60 * 1000; // 1 minute

export async function getStripeConfig(): Promise<StripeConfig> {
    const now = Date.now();
    
    // Return cached config if it's still valid
    if (cachedConfig && (now - lastFetchTime) < CACHE_TTL) {
        return cachedConfig;
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, mode, is_active')
            .eq('provider', 'stripe')
            .eq('is_active', true)
            .single();

        if (!error && data) {
            cachedConfig = {
                publishableKey: data.publishable_key,
                secretKey: data.secret_key,
                mode: data.mode as 'live' | 'test',
                isActive: data.is_active
            };
            lastFetchTime = now;
            return cachedConfig;
        }
        
        // If row not found (PGRST116), log explicitly
        if (error && error.code === 'PGRST116') {
             console.warn('⚠️ [Payment Settings] No active Stripe configuration found in Supabase. Falling back to environment variables.');
        } else if (error) {
             console.error('❌ [Payment Settings] Error fetching Stripe config:', error);
        }
    } catch (err) {
        console.error('❌ [Payment Settings] Unexpected error fetching Stripe config:', err);
    }

    // Fallback to environment variables
    const fallbackConfig: StripeConfig = {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
        isActive: !!process.env.STRIPE_SECRET_KEY
    };

    if (!fallbackConfig.secretKey) {
         console.warn('⚠️ [Payment Settings] Both Supabase and environment variables are missing Stripe Secret Key!');
    }

    // Cache the fallback so we don't spam the DB when things are intentionally left as env variables
    cachedConfig = fallbackConfig;
    lastFetchTime = now;

    return fallbackConfig;
}

/**
 * Fetches the global PayPal Unclaimed configuration from the database.
 */
export async function getPaypalUnclaimedConfig(): Promise<PaypalConfig> {
    const now = Date.now();
    
    if (cachedPaypalConfig && (now - lastPaypalFetchTime) < CACHE_TTL) {
        return cachedPaypalConfig;
    }

    try {
        let data: { payee_email?: string | null; publishable_key?: string | null } | null = null;
        let error: any = null;

        const primaryResult = await supabaseAdmin
            .from('payment_settings')
            .select('payee_email, publishable_key')
            .eq('provider', 'paypal-unclaimed')
            .eq('is_active', true)
            .single();

        data = primaryResult.data;
        error = primaryResult.error;

        // Backward-compatible fallback for databases that do not yet have payee_email.
        if (error && error.code === '42703') {
            const fallbackResult = await supabaseAdmin
                .from('payment_settings')
                .select('publishable_key')
                .eq('provider', 'paypal-unclaimed')
                .eq('is_active', true)
                .single();

            data = fallbackResult.data;
            error = fallbackResult.error;
        }

        if (!error && data) {
            cachedPaypalConfig = {
                payeeEmail: data.payee_email || data.publishable_key || ''
            };
            lastPaypalFetchTime = now;
            return cachedPaypalConfig;
        }
    } catch (err) {
        console.error('❌ [Payment Settings] Unexpected error fetching PayPal config:', err);
    }

    // Default fallback
    const fallback: PaypalConfig = {
        payeeEmail: ''
    };
    cachedPaypalConfig = fallback;
    lastPaypalFetchTime = now;
    return fallback;
}

/**
 * Force invalidate the Stripe config cache.
 * Useful when saving new keys from the admin dashboard.
 */
export function invalidateStripeConfigCache() {
    cachedConfig = null;
    lastFetchTime = 0;
}

export function invalidatePaypalConfigCache() {
    cachedPaypalConfig = null;
    lastPaypalFetchTime = 0;
}
