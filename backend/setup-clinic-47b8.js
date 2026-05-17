const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzfdxstpomdcoucywimy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZmR4c3Rwb21kY291Y3l3aW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTEyMSwiZXhwIjoyMDkzNjA1MTIxfQ.3PyTy51vHAs_Gv_UEt0_dE2-me78l4jUgly30h853nE';

const supabase = createClient(supabaseUrl, supabaseKey);

const clinicId = '47b8dd61-085d-451d-a166-f0db2c79d4fe';

async function setup() {
  try {
    console.log('Setting up clinic:', clinicId);
    console.log('Adding onboarding drug...\n');
    
    // Add a drug
    const { data: drug, error: drugError } = await supabase
      .from('drugs')
      .insert([{
        clinic_id: clinicId,
        name: 'Onboarding Drug',
        generic_name: 'Test',
        description: 'Test drug for onboarding',
        dosage_form: 'Tablet',
        strength: '500mg',
        manufacturer: 'Test Mfg',
        cost_price: 100,
        selling_price: 200,
        status: 'active'
      }])
      .select();
    
    if (drugError) {
      console.log('Drug error:', drugError);
    } else {
      console.log('✓ Drug added:', drug[0]?.id);
    }
    
    // Check current count
    const { count: drugCount } = await supabase
      .from('drugs')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    
    console.log('\nTotal drugs now:', drugCount);
    
    // Test the security endpoint would return
    console.log('\nNow test /security.php with this clinic ID to verify facilityConfigCount > 0');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setup();
