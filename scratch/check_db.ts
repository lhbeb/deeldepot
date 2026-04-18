
import { supabaseAdmin } from './src/lib/supabase/server';

async function checkPaymentSettings() {
  const { data, error } = await supabaseAdmin
    .from('payment_settings')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Payment Settings:');
  data.forEach(row => {
    console.log(`- Provider: ${row.provider}, Active: ${row.is_active}, PubKey: ${row.publishable_key?.substring(0, 10)}..., Payee: ${row.payee_email}`);
  });
}

checkPaymentSettings();
