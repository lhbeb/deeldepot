const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Fetching orders...');
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, product_slug')
        .limit(5);

    if (ordersError) {
        console.error('Orders error:', ordersError);
        return;
    }

    console.log('Orders found:', orders.length);
    if (orders.length === 0) return;

    const productSlugs = [...new Set(orders.map(o => o.product_slug).filter(Boolean))];
    console.log('Product slugs:', productSlugs);

    if (productSlugs.length > 0) {
        console.log('Fetching products...');
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('slug, listed_by, checkout_flow')
            .in('slug', productSlugs);

        if (productsError) {
            console.error('Products error:', productsError);
        } else {
            console.log('Products found:', products);
        }
    }
}

inspect();
