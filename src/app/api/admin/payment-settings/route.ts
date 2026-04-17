import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { invalidateStripeConfigCache, invalidatePaypalConfigCache } from '@/lib/supabase/payment-settings';

// Helper to get auth from request
async function getSuperAdminAuth(request: NextRequest) {
    // Bypass authentication in development if enabled
    const { shouldBypassAuth } = await import('@/lib/supabase/auth');
    if (shouldBypassAuth()) {
        return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
    }

    const token = request.cookies.get('admin_token')?.value;
    if (token) {
        try {
            const { jwtVerify } = await import('jose');
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
            const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);
            const { payload } = await jwtVerify(token, getSecretKey());
            const decoded = payload as { role: string; isActive: boolean; email: string };

            if (!decoded.isActive) return null;
            if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'super-admin' && decoded.role !== 'ADMIN' && decoded.role !== 'admin') return null;

            return { authenticated: true, role: decoded.role, email: decoded.email };
        } catch (error) {
            console.error('❌ [AUTH] JWT verification failed:', error);
            return null;
        }
    }
    return null;
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getSuperAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        // Fetch Stripe settings
        const { data: stripeData, error: stripeError } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, mode, is_active')
            .eq('provider', 'stripe')
            .single();

        // Fetch PayPal settings
        const { data: paypalData, error: paypalError } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, is_active')
            .eq('provider', 'paypal-unclaimed')
            .single();

        if (stripeError && stripeError.code !== 'PGRST116') {
            console.error('Error fetching Stripe settings:', stripeError);
        }

        if (paypalError && paypalError.code !== 'PGRST116') {
            console.error('Error fetching PayPal settings:', paypalError);
        }

        const response: any = {
            stripe: null,
            paypal: null
        };

        if (stripeData) {
            const secretLength = stripeData.secret_key.length;
            const visibleChars = 8;
            const maskedSecret = stripeData.secret_key.substring(0, visibleChars) + '*'.repeat(Math.max(0, secretLength - visibleChars));
            
            response.stripe = {
                isConfigured: true,
                publishableKey: stripeData.publishable_key,
                secretKey: maskedSecret,
                mode: stripeData.mode,
                isActive: stripeData.is_active
            };
        }

        if (paypalData) {
            response.paypal = {
                isConfigured: true,
                payeeEmail: paypalData.publishable_key,
                isActive: paypalData.is_active
            };
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in GET payment settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getSuperAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const body = await request.json();
        const { provider, publishableKey, secretKey, mode, payeeEmail } = body;

        if (provider === 'paypal-unclaimed') {
            if (!payeeEmail) {
                return NextResponse.json({ error: 'Missing Payee Email' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('payment_settings')
                .upsert({
                    provider: 'paypal-unclaimed',
                    publishable_key: payeeEmail,
                    is_active: true,
                    updated_by: auth.email
                }, { onConflict: 'provider' });

            if (error) {
                console.error('Error upserting PayPal settings:', error);
                return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
            }

            invalidatePaypalConfigCache();
            return NextResponse.json({ success: true, message: 'PayPal settings saved successfully.' });
        }

        // Default Stripe logic
        if (!publishableKey || !secretKey || !mode) {
            return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
        }

        if (!publishableKey.startsWith('pk_')) {
            return NextResponse.json({ error: 'Invalid Publishable Key signature' }, { status: 400 });
        }

        if (!secretKey.startsWith('sk_') && !secretKey.startsWith('rk_')) {
            if (secretKey.includes('***')) {
                return NextResponse.json({ error: 'Please provide the full secret key, not the masked view' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Invalid Secret Key signature' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('payment_settings')
            .upsert({
                provider: 'stripe',
                publishable_key: publishableKey,
                secret_key: secretKey,
                mode: mode,
                is_active: true,
                updated_by: auth.email
            }, { onConflict: 'provider' });

        if (error) {
            console.error('Error upserting Stripe settings:', error);
            return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
        }

        invalidateStripeConfigCache();
        return NextResponse.json({ success: true, message: 'Stripe settings saved successfully.' });

    } catch (error) {
        console.error('Error in POST payment settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
