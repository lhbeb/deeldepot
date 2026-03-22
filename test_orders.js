const { getAllOrders } = require('./src/lib/supabase/orders');

async function test() {
    const orders = await getAllOrders();
    console.log('Total orders:', orders.length);
    const withListedBy = orders.filter(o => o.product_listed_by);
    console.log('Orders with product_listed_by:', withListedBy.length);

    if (withListedBy.length < orders.length) {
        console.log('Some orders missing listed_by. Example:', orders.find(o => !o.product_listed_by));
    }
}

test();
