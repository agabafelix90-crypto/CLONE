const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}

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
