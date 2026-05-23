const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const clinicId = '743da65d-683d-499a-8760-a051014436cc';

async function debugCounts() {
  console.log('Testing countClinicSetupItems calculation...\n');
  console.log('Clinic ID:', clinicId);
  
  try {
    console.log('\n=== Checking drugs ===');
    const { count: drugCount = 0, error: drugError, data: drugs } = await supabase
      .from('drugs')
      .select('id, clinic_id', { count: 'exact' })
      .eq('clinic_id', clinicId);
    
    console.log('Drug count:', drugCount);
    console.log('Drug error:', drugError);
    if (drugs && drugs.length > 0) {
      console.log('First 3 drugs:', drugs.slice(0, 3));
    }

    console.log('\n=== Checking lab_test_templates ===');
    const { count: templateCount = 0, error: templateError } = await supabase
      .from('lab_test_templates')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    
    console.log('Lab template count:', templateCount);
    console.log('Lab template error:', templateError);

    console.log('\n=== Checking billing_items ===');
    const { count: billingCount = 0, error: billingError } = await supabase
      .from('billing_items')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    
    console.log('Billing items count:', billingCount);
    console.log('Billing items error:', billingError);

    console.log('\n=== Checking legacy tables ===');
    const legacyTables = ['procedures', 'lab_tests', 'radiology_tests', 'services'];
    let legacyTotal = 0;
    
    for (const table of legacyTables) {
      try {
        const { count = 0, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId);
        
        console.log(`  ${table}: count=${count}, error=${error?.message || 'none'}`);
        if (!error) legacyTotal += count;
      } catch (err) {
        console.log(`  ${table}: error=${err.message}`);
      }
    }
    console.log('Legacy tables total:', legacyTotal);

    const facilityConfigCount = (drugCount || 0) + (templateCount || 0) + (billingCount || 0) + legacyTotal;
    console.log('\n=== TOTAL facilityConfigCount ===');
    console.log(facilityConfigCount);
    console.log('Expected: > 0 (for onboarding to complete)');
    console.log('Current status: ' + (facilityConfigCount > 0 ? 'OK' : 'FAIL'));

  } catch (error) {
    console.error('Error:', error);
  }
}

debugCounts();
