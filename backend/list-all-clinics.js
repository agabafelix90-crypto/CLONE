const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}

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
