const { supabase } = require('./src/lib/supabaseClient');
(async () => {
  const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
  const { data, error } = await supabase.from('clinics').select('id,name,email,last_active_at,session_expires_at').eq('id', clinicId).maybeSingle();
  console.log('error=', error);
  console.log('data=', data);
})();
