require('dotenv').config();
const { supabase } = require('./src/lib/supabaseClient');

(async () => {
  try {
    // Get the clinic
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, is_first_login, admin_password_changed')
      .eq('id', '743da65d-683d-499a-8760-a051014436cc')
      .maybeSingle();

    if (clinicError) {
      console.error('Clinic query error:', clinicError);
      process.exit(1);
    }

    if (!clinic) {
      console.error('Clinic not found');
      process.exit(1);
    }

    console.log('Current clinic status:',  clinic);

    // Mark is_first_login as false if not already
    if (clinic.is_first_login === true) {
      const { data: updateData, error: updateError } = await supabase
        .from('clinics')
        .update({
          is_first_login: false,
          welcome_shown: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinic.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        process.exit(1);
      }

      console.log('Updated clinic:', updateData);
    } else {
      console.log('Clinic already has is_first_login = false');
    }

    // Verify the update
    const { data: verifyClinic, error: verifyError } = await supabase
      .from('clinics')
      .select('id, is_first_login')
      .eq('id', clinic.id)
      .maybeSingle();

    if (!verifyError) {
      console.log('Verified clinic status:', verifyClinic);
    }

    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
})();
