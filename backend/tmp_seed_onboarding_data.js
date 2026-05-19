require('dotenv').config();
const { supabase } = require('./src/lib/supabaseClient');

(async () => {
  const clinicName = 'DIVINE CARE MEDICAL CENTER';

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name, email')
    .eq('name', clinicName)
    .maybeSingle();

  if (clinicError) {
    console.error('Clinic query error:', clinicError);
    process.exit(1);
  }
  if (!clinic) {
    console.error('Clinic not found by name:', clinicName);
    process.exit(1);
  }

  console.log('Clinic found:', clinic.id, clinic.name, clinic.email);

  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('clinic_id', clinic.id)
    .limit(1);
  if (employeeError) {
    console.error('Employee query error:', employeeError);
    process.exit(1);
  }

  if (!employees || employees.length === 0) {
    const { data: employeeData, error: insertEmpError } = await supabase
      .from('employees')
      .insert([{ clinic_id: clinic.id, name: 'Default Employee', email: 'employee@divinecare.test', phone: '+256700000000', role: 'admin', status: 'active', password: '123456' }])
      .select('id')
      .maybeSingle();
    if (insertEmpError) {
      console.error('Failed to insert employee:', insertEmpError);
      process.exit(1);
    }
    console.log('Inserted employee id:', employeeData?.id || 'unknown');
  } else {
    console.log('Employee already exists');
  }

  const { data: drugs, error: drugError } = await supabase
    .from('drugs')
    .select('id')
    .eq('clinic_id', clinic.id)
    .limit(1);
  if (drugError) {
    console.error('Drug query error:', drugError);
    process.exit(1);
  }

  if (!drugs || drugs.length === 0) {
    const { data: drugData, error: insertDrugError } = await supabase
      .from('drugs')
      .insert([{ clinic_id: clinic.id, name: 'Onboarding Drug', generic_name: 'Onboarding', description: 'Auto-created onboarding drug', dosage_form: 'tablet', strength: '10mg', manufacturer: 'MEDCORE', cost_price: 1.00, selling_price: 2.00, status: 'active' }])
      .select('id')
      .maybeSingle();
    if (insertDrugError) {
      console.error('Failed to insert drug:', insertDrugError);
      process.exit(1);
    }
    console.log('Inserted drug id:', drugData?.id || 'unknown');
  } else {
    console.log('Drug already exists');
  }

  const { data: employeeCount } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinic.id);
  const { data: drugCount } = await supabase
    .from('drugs')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinic.id);

  console.log('Final counts:', {
    employees: employeeCount?.length !== undefined ? employeeCount.length : 'unknown',
    drugs: drugCount?.length !== undefined ? drugCount.length : 'unknown',
  });

  process.exit(0);
})();

