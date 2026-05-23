const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await supabase.from('clinics').select('*').limit(5);
  console.log(JSON.stringify({ error, data }, null, 2));
})();
