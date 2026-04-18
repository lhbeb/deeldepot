
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vfuedgrheyncotoxseos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdWVkZ3JoZXluY290b3hzZW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAzMDM4MCwiZXhwIjoyMDc3NjA2MzgwfQ.gxykjdi3SsfnFaFTocKa0k9ddrxF9PcvJCShqp2UD5Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('provider', 'paypal');
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
