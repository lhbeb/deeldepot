import { NextResponse } from 'next/server';
import { getPaypalDirectConfig } from '@/lib/supabase/payment-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await getPaypalDirectConfig();

        if (!config.payeeEmail) {
            return NextResponse.json({ 
                error: 'PayPal Direct Checkout not configured. Add your PayPal email in Payment Settings.',
                configured: false 
            }, { status: 404 });
        }

        return NextResponse.json({
            configured: true,
            payeeEmail: config.payeeEmail,
        });
    } catch (error) {
        console.error('Error fetching PayPal Direct Checkout config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
