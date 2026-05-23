const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePassword() {
  const { data, error } = await supabase
    .from('clinics')
    .update({ password: '123456' })
    .eq('name', 'AGABA')
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated:', data);
  }
}

updatePassword();
