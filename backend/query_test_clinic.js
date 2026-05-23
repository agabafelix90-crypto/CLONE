const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabase.from('clinics').select('id,name,email,is_first_login,admin_password_changed').ilike('name','Test Clinic').limit(10);
  console.log(JSON.stringify({ data, error }, null, 2));
})();
