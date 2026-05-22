const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://jzfdxstpomdcoucywimy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZmR4c3Rwb21kY291Y3l3aW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTEyMSwiZXhwIjoyMDkzNjA1MTIxfQ.3PyTy51vHAs_Gv_UEt0_dE2-me78l4jUgly30h853nE';
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await supabase.from('clinics').select('id,name,email,owners_info,is_first_login').eq('name','DEVINE CARE MEDICAL CENTER');
  console.log('error', error);
  console.log(JSON.stringify(data, null, 2));
})();
