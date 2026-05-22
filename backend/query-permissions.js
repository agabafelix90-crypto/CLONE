const { supabase } = require('./src/lib/supabaseClient');
(async () => {
  const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
  const { data: employees, error: empError } = await supabase.from('employees').select('id,name,role').eq('clinic_id', clinicId);
  console.log('employees error=', empError);
  for (const e of employees || []) {
    const { data: perms, error: permError } = await supabase.from('permissions').select('permission').eq('employee_id', e.id);
    console.log('employee=', e.name, e.role, 'error=', permError, 'permissions=', perms);
  }
})();
