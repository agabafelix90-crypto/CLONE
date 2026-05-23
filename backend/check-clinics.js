const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClinic() {
  // Check for clinic with the email
  console.log('Checking for clinic with email agabafelix112@gmail.com\n');
  
  const { data: clinics } = await supabase
    .from('clinics')
    .select('*')
    .or('email.eq.agabafelix112@gmail.com, owner_email.eq.agabafelix112@gmail.com');
  
  if (clinics && clinics.length > 0) {
    clinics.forEach(c => {
      console.log(`Clinic ID: ${c.id}`);
      console.log(`  Name: ${c.name}`);
      console.log(`  Email: ${c.email}`);
      console.log(`  is_first_login: ${c.is_first_login}\n`);
    });
  } else {
    console.log('No clinics found with that email');
  }
  
  // Check the two clinic IDs we're interested in
  console.log('\nChecking specific clinic IDs:\n');
  
  const clinicIds = [
    '743da65d-683d-499a-8760-a051014436cc',
    '47b8dd61-085d-451d-a166-f0db2c79d4fe'
  ];
  
  for (const id of clinicIds) {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, name, email, is_first_login')
      .eq('id', id)
      .maybeSingle();
    
    if (clinic) {
      console.log(`Clinic ${id}:`);
      console.log(`  Name: ${clinic.name}`);
      console.log(`  Email: ${clinic.email}`);
      console.log(`  is_first_login: ${clinic.is_first_login}`);
      
      // Check drugs count
      const { count: drugCount } = await supabase
        .from('drugs')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', id);
      
      console.log(`  Drug count: ${drugCount}`);
    }
    console.log();
  }
}

checkClinic();
