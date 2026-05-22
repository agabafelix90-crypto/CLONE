const { supabase } = require('./backend/src/lib/supabaseClient');
const bcrypt = require('bcryptjs');
(async () => {
  const { data } = await supabase.from('clinics').select('id,name,email,owners_info').eq('name', 'DEVINE CARE MEDICAL CENTER');
  for (const clinic of data) {
    const hash = clinic?.owners_info?.auth?.password_hash;
    console.log('Clinic', clinic.id, clinic.email);
    console.log('  hash:', hash);
    if (!hash) continue;
    console.log('  8017 matches:', await bcrypt.compare('8017', hash));
    console.log('  12345 matches:', await bcrypt.compare('12345', hash));
  }
})();
