require('dotenv').config();
const { supabase } = require('./src/lib/supabaseClient');

(async () => {
  try {
    // Get the clinic
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, is_first_login')
      .eq('name', 'DIVINE CARE MEDICAL CENTER')
      .maybeSingle();

    if (clinicError) {
      console.error('Clinic query error:', clinicError);
      process.exit(1);
    }

    if (!clinic) {
      console.error('Clinic not found');
      process.exit(1);
    }

    console.log('Clinic found:', clinic.id, clinic.name, 'is_first_login:', clinic.is_first_login);

    // Check drugs
    const { data: drugs, error: drugError, count: drugCount } = await supabase
      .from('drugs')
      .select('id, name, clinic_id', { count: 'exact' })
      .eq('clinic_id', clinic.id);

    if (drugError) {
      console.error('Drug query error:', drugError);
    } else {
      console.log('Drugs found:', drugCount, drugs);
    }

    // Check lab test templates
    const { data: labTests, error: labError, count: labCount } = await supabase
      .from('lab_test_templates')
      .select('id, name, clinic_id', { count: 'exact' })
      .eq('clinic_id', clinic.id);

    if (labError) {
      console.log('Lab test query error (might not exist):', labError.message);
    } else {
      console.log('Lab tests found:', labCount, labTests);
    }

    // Check employees
    const { data: employees, error: empError, count: empCount } = await supabase
      .from('employees')
      .select('id, name, clinic_id', { count: 'exact' })
      .eq('clinic_id', clinic.id);

    if (empError) {
      console.error('Employee query error:', empError);
    } else {
      console.log('Employees found:', empCount, employees);
    }

    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
})();
