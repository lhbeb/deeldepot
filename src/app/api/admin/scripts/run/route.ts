import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// ─── Auth helper (same pattern as other admin routes) ─────────────────────────
async function getAdminAuth(request: NextRequest) {
    const { shouldBypassAuth } = await import('@/lib/supabase/auth');
    if (shouldBypassAuth()) {
        return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
    }

    const token = request.cookies.get('admin_token')?.value;
    if (!token) return null;

    try {
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const decoded = payload as { id: string; email: string; role: string; isActive: boolean };
        if (!decoded.isActive) return null;
        return { authenticated: true, role: decoded.role, email: decoded.email };
    } catch {
        return null;
    }
}

// ─── Script definitions ────────────────────────────────────────────────────────
interface ScriptResult {
    slug: string;
    title: string;
    oldLink: string;
    newLink: string;
    updated: boolean;
}

interface FlowResult {
    slug: string;
    title: string;
    oldFlow: string;
    newFlow: string;
    updated: boolean;
}

/**
 * Script: replace-bmc-username
 * Replaces a BuyMeACoffee username segment in checkout_link across all products.
 * Preserves the checkout token UUID.
 */
async function runReplaceBmcUsername(
    fromUsername: string,
    toUsername: string,
    dryRun: boolean
): Promise<{ affected: number; results: ScriptResult[] }> {
    // Fetch all products
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('slug, title, checkout_link');

    if (error) throw new Error(`Failed to fetch products: ${error.message}`);

    const products = data || [];
    const affected: ScriptResult[] = [];

    for (const product of products) {
        const oldLink: string = product.checkout_link || '';
        if (!oldLink.includes(`/${fromUsername}`)) continue;

        const newLink = oldLink.replace(`/${fromUsername}`, `/${toUsername}`);
        affected.push({
            slug: product.slug,
            title: product.title,
            oldLink,
            newLink,
            updated: false,
        });
    }

    if (!dryRun && affected.length > 0) {
        // Perform bulk updates
        for (const item of affected) {
            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({
                    checkout_link: item.newLink,
                    updated_at: new Date().toISOString(),
                })
                .eq('slug', item.slug);

            if (updateError) {
                console.error(`❌ Failed to update product ${item.slug}:`, updateError.message);
                item.updated = false;
            } else {
                item.updated = true;
            }
        }
    }

    return { affected: affected.length, results: affected };
}

/**
 * Script: bulk-update-checkout-flow
 * Changes checkout_flow for all (or filtered) products.
 * NEVER touches checkout_link.
 */
async function runBulkUpdateCheckoutFlow(
    fromFlow: string,
    toFlow: string,
    dryRun: boolean
): Promise<{ affected: number; results: FlowResult[] }> {
    // Build query — optionally filter by current flow
    let query = supabaseAdmin.from('products').select('slug, title, checkout_flow');
    if (fromFlow !== 'all') {
        query = query.eq('checkout_flow', fromFlow);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch products: ${error.message}`);

    const products = data || [];
    const affected: FlowResult[] = products.map(p => ({
        slug: p.slug,
        title: p.title,
        oldFlow: p.checkout_flow || 'buymeacoffee',
        newFlow: toFlow,
        updated: false,
    }));

    if (!dryRun && affected.length > 0) {
        // Build the update — only checkout_flow, never checkout_link
        const updatePayload: any = {
            checkout_flow: toFlow,
            updated_at: new Date().toISOString(),
        };

        if (fromFlow === 'all') {
            // Update every product
            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update(updatePayload)
                .neq('slug', ''); // matches all rows

            if (updateError) {
                console.error('❌ Bulk flow update failed:', updateError.message);
            } else {
                affected.forEach(item => (item.updated = true));
            }
        } else {
            // Update only products with the matching flow
            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update(updatePayload)
                .eq('checkout_flow', fromFlow);

            if (updateError) {
                console.error('❌ Bulk flow update failed:', updateError.message);
            } else {
                affected.forEach(item => (item.updated = true));
            }
        }
    }

    return { affected: affected.length, results: affected };
}

/**
 * Script: bulk-mark-sold-out
 * Toggles in_stock for all (or filtered) products.
 * action = 'mark_sold_out' → sets in_stock = false
 * action = 'mark_available' → sets in_stock = true
 */
async function runBulkMarkSoldOut(
    action: string,      // 'mark_sold_out' | 'mark_available'
    targetFilter: string, // 'matching_only' | 'all'
    dryRun: boolean
): Promise<{ affected: number; results: FlowResult[] }> {
    const markingSoldOut = action === 'mark_sold_out';
    const newStockValue = !markingSoldOut; // sold_out → false, available → true

    // Filter: only fetch products that aren't already in the target state
    let query = supabaseAdmin.from('products').select('slug, title, in_stock');
    if (targetFilter === 'matching_only') {
        // Only affect products that need changing
        if (markingSoldOut) {
            query = query.neq('in_stock', false); // only in-stock products
        } else {
            query = query.eq('in_stock', false);  // only sold-out products
        }
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch products: ${error.message}`);

    const products = data || [];
    const affected: FlowResult[] = products.map(p => ({
        slug: p.slug,
        title: p.title,
        oldFlow: p.in_stock === false ? 'sold out' : 'available',
        newFlow: markingSoldOut ? 'sold out' : 'available',
        updated: false,
    }));

    if (!dryRun && affected.length > 0) {
        let updateQuery = supabaseAdmin
            .from('products')
            .update({ in_stock: newStockValue, updated_at: new Date().toISOString() });

        if (targetFilter === 'matching_only') {
            updateQuery = markingSoldOut
                ? updateQuery.neq('in_stock', false)
                : updateQuery.eq('in_stock', false);
        } else {
            updateQuery = updateQuery.neq('slug', ''); // all rows
        }

        const { error: updateError } = await updateQuery;
        if (updateError) {
            console.error('❌ Bulk stock update failed:', updateError.message);
        } else {
            affected.forEach(item => (item.updated = true));
        }
    }

    return { affected: affected.length, results: affected };
}

// ─── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { scriptId, dryRun = true, params = {} } = body;

        if (!scriptId) {
            return NextResponse.json({ error: 'scriptId is required' }, { status: 400 });
        }

        // Only SUPER_ADMIN can run scripts
        if (auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Scripts are restricted to Super Admin accounts only.' },
                { status: 403 }
            );
        }

        console.log(`🚀 [SCRIPTS] Running script: ${scriptId}, dryRun: ${dryRun}, by: ${auth.email}`);

        switch (scriptId) {
            case 'replace-bmc-username': {
                const fromUsername = params.fromUsername || 'cortniemartens';
                const toUsername = params.toUsername || 'tonidavis';

                if (!fromUsername || !toUsername) {
                    return NextResponse.json(
                        { error: 'fromUsername and toUsername are required' },
                        { status: 400 }
                    );
                }

                const result = await runReplaceBmcUsername(fromUsername, toUsername, dryRun);

                return NextResponse.json({
                    scriptId,
                    dryRun,
                    affected: result.affected,
                    results: result.results,
                    message: dryRun
                        ? `Preview: ${result.affected} product(s) would be updated`
                        : `Done: ${result.results.filter(r => r.updated).length} product(s) updated`,
                });
            }

            case 'bulk-update-checkout-flow': {
                const fromFlow = params.fromFlow || 'all';
                const toFlow = params.toFlow;

                const validFlows = ['buymeacoffee', 'stripe', 'kofi', 'external', 'paypal-invoice'];
                if (!toFlow || !validFlows.includes(toFlow)) {
                    return NextResponse.json(
                        { error: `toFlow must be one of: ${validFlows.join(', ')}` },
                        { status: 400 }
                    );
                }

                const result = await runBulkUpdateCheckoutFlow(fromFlow, toFlow, dryRun);

                return NextResponse.json({
                    scriptId,
                    dryRun,
                    affected: result.affected,
                    results: result.results,
                    message: dryRun
                        ? `Preview: ${result.affected} product(s) would have checkout_flow changed to "${toFlow}"`
                        : `Done: ${result.results.filter(r => r.updated).length} product(s) updated to "${toFlow}"`,
                });
            }

            case 'bulk-mark-sold-out': {
                const action = params.action || 'mark_sold_out';
                const targetFilter = params.targetFilter || 'matching_only';
                const result = await runBulkMarkSoldOut(action, targetFilter, dryRun);

                const actionLabel = action === 'mark_sold_out' ? 'sold out' : 'available';
                return NextResponse.json({
                    scriptId,
                    dryRun,
                    affected: result.affected,
                    results: result.results,
                    message: dryRun
                        ? `Preview: ${result.affected} product(s) would be marked as ${actionLabel}`
                        : `Done: ${result.results.filter(r => r.updated).length} product(s) marked as ${actionLabel}`,
                });
            }

            default:
                return NextResponse.json({ error: `Unknown scriptId: ${scriptId}` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('❌ [SCRIPTS] Error running script:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to run script' },
            { status: 500 }
        );
    }
}
