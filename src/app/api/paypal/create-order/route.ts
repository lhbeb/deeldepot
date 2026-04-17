import { NextRequest, NextResponse } from 'next/server';
import { getPaypalUnclaimedConfig } from '@/lib/supabase/payment-settings';

// PayPal sandbox base URL — swap to https://api-m.paypal.com for live
const PAYPAL_BASE = process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'sb';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'sb-secret';

async function getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`PayPal auth failed: ${err}`);
    }
    const data = await res.json();
    return data.access_token;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency, description, returnUrl, cancelUrl } = body;

        if (!amount || !currency || !returnUrl || !cancelUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get global payee email from DB
        const config = await getPaypalUnclaimedConfig();
        const payeeEmail = config.payeeEmail;

        if (!payeeEmail) {
            return NextResponse.json({ error: 'PayPal payee not configured' }, { status: 500 });
        }

        const accessToken = await getAccessToken();

        const orderPayload: any = {
            intent: 'CAPTURE',
            purchase_units: [{
                description,
                amount: {
                    currency_code: currency || 'USD',
                    value: parseFloat(amount).toFixed(2),
                },
                payee: {
                    email_address: payeeEmail,
                },
            }],
            application_context: {
                return_url: returnUrl,
                cancel_url: cancelUrl,
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'DeelDepot',
            },
        };

        const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': `deeldepot-${Date.now()}`,
            },
            body: JSON.stringify(orderPayload),
        });

        if (!orderRes.ok) {
            const err = await orderRes.text();
            console.error('❌ [PayPal] Order creation failed:', err);
            return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
        }

        const order = await orderRes.json();

        // Find the approval URL
        const approveLink = order.links?.find((l: any) => l.rel === 'approve');
        if (!approveLink?.href) {
            return NextResponse.json({ error: 'No approval URL returned by PayPal' }, { status: 500 });
        }

        console.log('✅ [PayPal] Order created:', order.id);
        return NextResponse.json({
            orderId: order.id,
            approvalUrl: approveLink.href,
        });

    } catch (error) {
        console.error('❌ [PayPal] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
