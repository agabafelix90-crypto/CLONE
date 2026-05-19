const { supabase } = require('./src/lib/supabaseClient.js');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const { data } = await supabase
      .from('clinics')
      .select('owners_info')
      .eq('name', 'DIVINE CARE MEDICAL CENTER')
      .single();

    if (data?.owners_info?.auth?.password_hash) {
      const hash = data.owners_info.auth.password_hash;
      console.log('Hash length:', hash.length);
      console.log('Hash starts:', hash.substring(0, 20) + '...');
      
      const match = await bcrypt.compare('8017', hash);
      console.log('Password "8017" matches:', match);
      
      const defaultMatch = await bcrypt.compare('12345', hash);
      console.log('Password "12345" matches:', defaultMatch);
    } else {
      console.log('No hash found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
