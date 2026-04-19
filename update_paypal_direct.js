const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating database records from 'paypal-unclaimed' to 'paypal-direct'...");

  // Update payment_settings
  const { data: psData, error: psError } = await supabase
    .from('payment_settings')
    .update({ provider: 'paypal-direct' })
    .eq('provider', 'paypal-unclaimed');
  console.log("payment_settings update:", psError ? psError : 'Success');

  // Update products target
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .update({ checkout_flow: 'paypal-direct' })
    .eq('checkout_flow', 'paypal-unclaimed');
  console.log("products update:", prodError ? prodError : 'Success');

  // Update orders
  const { data: ordData, error: ordError } = await supabase
    .from('orders')
    .update({ checkout_flow: 'paypal-direct' })
    .eq('checkout_flow', 'paypal-unclaimed');
  console.log("orders update:", ordError ? ordError : 'Success');

  console.log("Done.");
}

run();
