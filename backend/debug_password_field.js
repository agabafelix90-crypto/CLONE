#!/usr/bin/env node

// Check if password field is being set correctly during registration

const { supabase } = require('./src/lib/supabaseClient');

async function checkPasswordField() {
  const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
  
  console.log('Checking password field in clinics table...\n');
  
  // Check just the password field
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name, password')
      .eq('id', clinicId)
      .maybeSingle();
    
    console.log('Query result:');
    console.log('- Data:', data);
    console.log('- Error:', error);
    console.log('- Password is null:', data?.password === null);
    console.log('- Password is undefined:', data?.password === undefined);
  } catch (err) {
    console.log('Error running query:', err.message);
  }
  
  // Check the update payload issue
  console.log('\nChecking if password can be updated...\n');
  
  const testHash = 'test_hash_value_12345';
  const { error: updateError } = await supabase
    .from('clinics')
    .update({ password: testHash })
    .eq('id', clinicId);
  
  if (updateError) {
    console.log('Update error:', updateError);
  } else {
    console.log('Password field updated successfully');
    
    // Verify it was updated
    const { data } = await supabase
      .from('clinics')
      .select('password')
      .eq('id', clinicId)
      .maybeSingle();
    
    console.log('Verification - password after update:', data?.password);
    
    // Revert the test update
    await supabase
      .from('clinics')
      .update({ password: null })
      .eq('id', clinicId);
  }
}

checkPasswordField().catch(console.error).finally(() => process.exit(0));
