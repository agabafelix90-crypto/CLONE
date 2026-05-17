require('dotenv').config();
const { supabase } = require('./src/lib/supabaseClient');

(async () => {
  const clinicName = 'DIVINE CARE MEDICAL CENTER';

  let clinic = null;
  let clinicError = null;

  ({ data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name, email, password, is_first_login')
    .eq('name', clinicName)
    .maybeSingle());

  if (clinicError) {
    console.error('Clinic query error:', clinicError);
    process.exit(1);
  }

  if (!clinic) {
    ({ data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, email, password, is_first_login')
      .eq('email', clinicName)
      .maybeSingle());

    if (clinicError) {
      console.error('Clinic query error:', clinicError);
      process.exit(1);
    }
  }

  if (!clinic) {
    console.error('Clinic not found:', clinicName);
    process.exit(1);
  }

  console.log('Clinic found:', clinic.id, clinic.name, clinic.email);

  const { error: updateError } = await supabase
    .from('clinics')
    .update({ password: '123456' })
    .eq('id', clinic.id);
  if (updateError) {
    console.error('Failed to update clinic password:', updateError);
    process.exit(1);
  }
  console.log('Updated clinic password to 123456');

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
      .insert([{ clinic_id: clinic.id, name: 'Admin User', email: 'admin@divinecare.test', phone: '0000000000', role: 'admin', status: 'active', password: '123456' }])
      .select('id')
      .maybeSingle();
    if (insertEmpError) {
      console.error('Failed to insert employee:', insertEmpError);
      process.exit(1);
    }
    console.log('Inserted employee id:', employeeData?.id || 'unknown');
  } else {
    console.log('Existing employee found');
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
      .insert([{ clinic_id: clinic.id, name: 'Default Drug', generic_name: 'Default', description: 'Onboarding default drug', dosage_form: 'tablet', strength: '10mg', manufacturer: 'ClinicPro', cost_price: 1.00, selling_price: 2.00, status: 'active' }])
      .select('id')
      .maybeSingle();
    if (insertDrugError) {
      console.error('Failed to insert drug:', insertDrugError);
      process.exit(1);
    }
    console.log('Inserted drug id:', drugData?.id || 'unknown');
  } else {
    console.log('Existing drug found');
  }

  console.log('Completed onboarding seed data.');
  process.exit(0);
})();
