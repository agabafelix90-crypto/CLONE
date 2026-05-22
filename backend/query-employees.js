const { supabase } = require('./src/lib/supabaseClient');
(async () => {
  const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
  const { data, error } = await supabase.from('employees').select('id,name,role,login_code').eq('clinic_id', clinicId).order('created_at', { ascending: true });
  console.log('error=', error);
  console.log('data=', data);
})();
