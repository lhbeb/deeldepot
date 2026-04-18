import { NextResponse } from 'next/server';
import { getPaypalUnclaimedConfig } from '@/lib/supabase/payment-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await getPaypalUnclaimedConfig();

        if (!config.payeeEmail && !config.clientId) {
            return NextResponse.json({ 
                error: 'PayPal configuration not found',
                configured: false 
            }, { status: 404 });
        }

        return NextResponse.json({
            configured: true,
            payeeEmail: config.payeeEmail,
            clientId: config.clientId || 'sb'
        });
    } catch (error) {
        console.error('Error fetching public PayPal config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
