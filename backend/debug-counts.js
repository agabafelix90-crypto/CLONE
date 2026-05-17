const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzfdxstpomdcoucywimy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZmR4c3Rwb21kY291Y3l3aW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTEyMSwiZXhwIjoyMDkzNjA1MTIxfQ.3PyTy51vHAs_Gv_UEt0_dE2-me78l4jUgly30h853nE';

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
