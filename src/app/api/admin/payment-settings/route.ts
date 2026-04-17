import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { invalidateStripeConfigCache } from '@/lib/supabase/payment-settings';

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

        const { data, error } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, mode, is_active')
            .eq('provider', 'stripe')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ isConfigured: false });
        }

        // Mask the secret key
        const secretLength = data.secret_key.length;
        const visibleChars = 8;
        const maskedSecret = data.secret_key.substring(0, visibleChars) + '*'.repeat(Math.max(0, secretLength - visibleChars));

        return NextResponse.json({
            isConfigured: true,
            provider: 'stripe',
            publishableKey: data.publishable_key,
            secretKey: maskedSecret,
            mode: data.mode,
            isActive: data.is_active
        });

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
        const { publishableKey, secretKey, mode } = body;

        // Basic validation
        if (!publishableKey || !secretKey || !mode) {
            return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
        }

        if (!publishableKey.startsWith('pk_')) {
            return NextResponse.json({ error: 'Invalid Publishable Key signature' }, { status: 400 });
        }

        if (!secretKey.startsWith('sk_') && !secretKey.startsWith('rk_')) {
            // Might be a masked key being sent back by mistake
            if (secretKey.includes('***')) {
                return NextResponse.json({ error: 'Please provide the full secret key, not the masked view' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Invalid Secret Key signature' }, { status: 400 });
        }

        // Upsert to database
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
            console.error('Error upserting payment settings:', error);
            return NextResponse.json({ error: 'Failed to save configuration to database' }, { status: 500 });
        }

        // Invalidate runtime cache
        invalidateStripeConfigCache();

        return NextResponse.json({ success: true, message: 'Payment settings saved successfully.' });

    } catch (error) {
        console.error('Error in POST payment settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
