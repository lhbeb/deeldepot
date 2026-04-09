import { NextResponse } from 'next/server';
import { getStripeConfig } from '@/lib/supabase/payment-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await getStripeConfig();
        
        return NextResponse.json({
            publishableKey: config.publishableKey,
        });
    } catch (error) {
        console.error('Error fetching public Stripe config:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment configuration' },
            { status: 500 }
        );
    }
}
