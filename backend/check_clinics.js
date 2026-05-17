require('dotenv').config();
const { supabase } = require('./src/lib/supabaseClient');

(async () => {
  const { data, error } = await supabase.from('clinics').select('id, name, email, is_first_login');
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log('Clinics in database:');
  if (data && data.length > 0) {
    data.forEach(c => console.log(`- ${c.name} (${c.email}), is_first_login: ${c.is_first_login}`));
  } else {
    console.log('No clinics found');
  }
  
  process.exit(0);
})();
