const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;
      ALTER TABLE products ADD CONSTRAINT products_checkout_flow_check CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe', 'paypal-invoice', 'paypal-direct'));
      
      -- Update existing records
      UPDATE products SET checkout_flow = 'paypal-direct' WHERE checkout_flow = 'paypal-unclaimed';
      UPDATE orders SET checkout_flow = 'paypal-direct' WHERE checkout_flow = 'paypal-unclaimed';
    `
  });
  console.log("SQL execution:", error ? error : "Success");
}
run();
