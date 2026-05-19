const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzfdxstpomdcoucywimy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZmR4c3Rwb21kY291Y3l3aW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTEyMSwiZXhwIjoyMDkzNjA1MTIxfQ.3PyTy51vHAs_Gv_UEt0_dE2-me78l4jUgly30h853nE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllClinics() {
  console.log('Fetching all clinics from the database...\n');
  
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('id, name, email')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching clinics:', error);
      return;
    }
    
    if (!clinics || clinics.length === 0) {
      console.log('No clinics found in the database.');
      return;
    }
    
    console.log(`Found ${clinics.length} clinic(s):\n`);
    
    clinics.forEach((clinic, index) => {
      console.log(`${index + 1}. ID: ${clinic.id}`);
      console.log(`   Name: ${clinic.name}`);
      console.log(`   Email: ${clinic.email}`);
      console.log('');
    });
    
    console.log(`\nTotal clinics: ${clinics.length}`);
  } catch (err) {
    console.error('Exception occurred:', err.message);
  }
}

listAllClinics();
