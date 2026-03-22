import { getAllOrders } from './src/lib/supabase/orders';

async function test() {
    const orders = await getAllOrders();
    console.log('Orders sample:', orders.slice(0, 1));
}

test();
