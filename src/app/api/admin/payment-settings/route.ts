import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { invalidateStripeConfigCache, invalidatePaypalConfigCache } from '@/lib/supabase/payment-settings';

// Helper to get admin auth from request
async function getAdminAuth(request: NextRequest) {
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
            const normalizedRole = decoded.role?.toUpperCase();

            if (!decoded.isActive) return null;
            if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(normalizedRole)) return null;

            return { authenticated: true, role: decoded.role, email: decoded.email };
        } catch (error) {
            console.error('❌ [AUTH] JWT verification failed:', error);
            return null;
        }
    }
    return null;
}

async function getPaypalSettingsRow() {
    let data: { payee_email?: string | null; publishable_key?: string | null; secret_key?: string | null; is_active?: boolean | null } | null = null;
    let error: any = null;

    const primaryResult = await supabaseAdmin
        .from('payment_settings')
        .select('payee_email, publishable_key, secret_key, is_active')
        .eq('provider', 'paypal-unclaimed')
        .single();

    data = primaryResult.data;
    error = primaryResult.error;

    // Backward-compatible fallback for databases that do not yet have payee_email.
    if (error && error.code === '42703') {
        const fallbackResult = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, is_active')
            .eq('provider', 'paypal-unclaimed')
            .single();

        data = fallbackResult.data;
        error = fallbackResult.error;
    }

    return { data, error };
}

async function getMainPaypalSettingsRow() {
    const { data, error } = await supabaseAdmin
        .from('payment_settings')
        .select('publishable_key, is_active')
        .eq('provider', 'paypal')
        .single();

    return { data, error };
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAdminAuth(request);
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
        const { data: paypalData, error: paypalError } = await getPaypalSettingsRow();

        if (stripeError && stripeError.code !== 'PGRST116') {
            console.error('Error fetching Stripe settings:', stripeError);
        }

        if (paypalError && paypalError.code !== 'PGRST116') {
            console.error('Error fetching PayPal settings:', paypalError);
        }

        const { data: mainPaypalData, error: mainPaypalError } = await getMainPaypalSettingsRow();

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
                payeeEmail: paypalData.payee_email || '',
                clientId: paypalData.publishable_key && paypalData.publishable_key !== paypalData.payee_email
                    ? paypalData.publishable_key
                    : '',
                hasSecret: Boolean(paypalData.secret_key && paypalData.secret_key !== 'paypal-not-applicable'),
                isActive: paypalData.is_active
            };
        }

        if (mainPaypalError && mainPaypalError.code !== 'PGRST116') {
            console.error('Error fetching main PayPal settings:', mainPaypalError);
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in GET payment settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const body = await request.json();
        const { provider, publishableKey, secretKey, mode, payeeEmail, clientId } = body;

        if (provider === 'paypal-unclaimed') {
            if (!payeeEmail) {
                return NextResponse.json({ error: 'Missing Payee Email' }, { status: 400 });
            }

            const secretToSave = secretKey && secretKey !== 'paypal-not-applicable' ? secretKey : undefined;
            // Store clientId in publishable_key (separate from payee_email)
            const clientIdToSave = clientId && clientId.trim() ? clientId.trim() : undefined;

            // Check if row already exists so we can UPDATE instead of INSERT
            const { data: existing } = await supabaseAdmin
                .from('payment_settings')
                .select('id')
                .eq('provider', 'paypal-unclaimed')
                .maybeSingle();

            let upsertError: any = null;

            if (existing) {
                const updatePayload: any = {
                    payee_email: payeeEmail,
                    is_active: true,
                    updated_by: auth.email
                };
                if (clientIdToSave) updatePayload.publishable_key = clientIdToSave;
                if (secretToSave) updatePayload.secret_key = secretToSave;

                const { error: updateError } = await supabaseAdmin
                    .from('payment_settings')
                    .update(updatePayload)
                    .eq('provider', 'paypal-unclaimed');
                upsertError = updateError;
            } else {
                const { error: insertError } = await supabaseAdmin
                    .from('payment_settings')
                    .insert({
                        provider: 'paypal-unclaimed',
                        payee_email: payeeEmail,
                        publishable_key: clientIdToSave || payeeEmail,
                        secret_key: secretToSave || 'paypal-not-applicable',
                        mode: 'live',
                        is_active: true,
                        updated_by: auth.email
                    });
                upsertError = insertError;
            }

            if (upsertError) {
                console.error('Error saving PayPal settings:', upsertError);
                return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
            }

            invalidatePaypalConfigCache();
            return NextResponse.json({ success: true, message: 'PayPal settings saved successfully.' });
        }

        if (provider === 'paypal') {
            if (!clientId) {
                return NextResponse.json({ error: 'Missing PayPal Client ID' }, { status: 400 });
            }

            const { data: existing } = await supabaseAdmin
                .from('payment_settings')
                .select('id')
                .eq('provider', 'paypal')
                .maybeSingle();

            let paypalClientError: any = null;

            if (existing) {
                const { error: updateError } = await supabaseAdmin
                    .from('payment_settings')
                    .update({
                        publishable_key: clientId,
                        is_active: true,
                        updated_by: auth.email
                    })
                    .eq('provider', 'paypal');
                paypalClientError = updateError;
            } else {
                const { error: insertError } = await supabaseAdmin
                    .from('payment_settings')
                    .insert({
                        provider: 'paypal',
                        publishable_key: clientId,
                        secret_key: 'paypal-not-applicable',
                        mode: 'live',
                        is_active: true,
                        updated_by: auth.email
                    });
                paypalClientError = insertError;
            }

            if (paypalClientError) {
                console.error('Error upserting main PayPal settings:', paypalClientError);
                return NextResponse.json({ error: 'Failed to save PayPal client configuration' }, { status: 500 });
            }

            invalidatePaypalConfigCache();
            return NextResponse.json({ success: true, message: 'PayPal client settings saved successfully.' });
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
