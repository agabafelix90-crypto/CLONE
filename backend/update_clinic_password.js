const { supabase } = require('./src/lib/supabaseClient.js');

(async () => {
  try {
    const newHash = '$2a$10$Rxk.q5/DQhQE7PqwalwbF.Uz3Kgr2X8w7ch7FLc9.37poKQYfwRUm';
    
    // Get the current clinic record to merge data
    const { data: clinic, error: selectError } = await supabase
      .from('clinics')
      .select('owners_info')
      .eq('name', 'DIVINE CARE MEDICAL CENTER')
      .single();

    if (selectError || !clinic) {
      console.log('Error fetching clinic:', selectError?.message);
      return;
    }

    const ownerInfo = clinic.owners_info || {};
    const auth = ownerInfo.auth || {};
    auth.password_hash = newHash;
    ownerInfo.auth = auth;

    // Update the clinic record
    const { error: updateError } = await supabase
      .from('clinics')
      .update({ owners_info: ownerInfo })
      .eq('name', 'DIVINE CARE MEDICAL CENTER');

    if (updateError) {
      console.log('Error updating clinic:', updateError.message);
    } else {
      console.log('Password hash updated successfully for DIVINE CARE MEDICAL CENTER');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
