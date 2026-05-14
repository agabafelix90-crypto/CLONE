require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await supabase.from('clinics').select('name,password').limit(1);
  console.log(JSON.stringify({ error, data }, null, 2));
})();
