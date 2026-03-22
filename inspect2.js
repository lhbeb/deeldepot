const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data: orders } = await supabase.from('orders').select('id, product_slug');
    const slugs = [...new Set(orders.map(o => o.product_slug).filter(Boolean))];

    if (slugs.length === 0) {
        console.log("No product slugs found in orders.");
        return;
    }

    const { data: products, error } = await supabase
        .from('products')
        .select('slug, listed_by, checkout_flow')
        .in('slug', slugs);

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    const listedByMap = new Map();
    products.forEach(p => listedByMap.set(p.slug, p.listed_by || null));

    let matchCount = 0;
    let missingCount = 0;

    orders.forEach(o => {
        const listedBy = listedByMap.get(o.product_slug);
        if (listedBy) matchCount++;
        else missingCount++;
    });

    console.log(`Matched: ${matchCount}, Missing: ${missingCount}`);

    // Show a missing one if any
    if (missingCount > 0) {
        const missingOrder = orders.find(o => !listedByMap.get(o.product_slug));
        console.log(`Example missing order product slug: ${missingOrder.product_slug}`);

        // Check if the product even exists in the products table
        const { data: p } = await supabase.from('products').select('slug, listed_by').eq('slug', missingOrder.product_slug).single();
        if (!p) {
            console.log(`Product ${missingOrder.product_slug} DOES NOT EXIST in the products table!`);
        } else {
            console.log(`Product exists, but listed_by is: ${p.listed_by}`);
        }
    }
}

check();
