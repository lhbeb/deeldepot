
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfuedgrheyncotoxseos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdWVkZ3JoZXluY290b3hzZW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAzMDM4MCwiZXhwIjoyMDc3NjA2MzgwfQ.gxykjdi3SsfnFaFTocKa0k9ddrxF9PcvJCShqp2UD5Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'payment_settings' });
  // If rpc fails, I'll try querying information_schema if possible, but usually rpc is not setup.
  // I'll just try to select * and look at keys of the first object.
  const { data: data2, error: error2 } = await supabase.from('payment_settings').select('*').limit(1);
  if (data2 && data2[0]) {
    console.log('Columns:', Object.keys(data2[0]));
  }
}

check();
