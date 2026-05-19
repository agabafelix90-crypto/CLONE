const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzfdxstpomdcoucywimy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZmR4c3Rwb21kY291Y3l3aW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTEyMSwiZXhwIjoyMDkzNjA1MTIxfQ.3PyTy51vHAs_Gv_UEt0_dE2-me78l4jUgly30h853nE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getClinicPassword() {
  console.log('Fetching clinic with email: agabafelix90@gmail.com\n');
  
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', 'agabafelix90@gmail.com');
    
    if (error) {
      console.error('Error fetching clinic:', error);
      return;
    }
    
    if (!clinics || clinics.length === 0) {
      console.log('No clinic found with that email.');
      return;
    }
    
    const clinic = clinics[0];
    
    console.log('Clinic Record Found:');
    console.log('='.repeat(50));
    console.log('ID:', clinic.id);
    console.log('Name:', clinic.name);
    console.log('Email:', clinic.email);
    console.log('Password:', clinic.password);
    console.log('='.repeat(50));
    
    console.log('\nFull record:', JSON.stringify(clinic, null, 2));
  } catch (err) {
    console.error('Exception occurred:', err.message);
  }
}

getClinicPassword();
