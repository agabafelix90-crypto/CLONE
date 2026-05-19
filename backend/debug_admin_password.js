#!/usr/bin/env node

// Debug script to check admin password for clinic

const { supabase } = require('./src/lib/supabaseClient');
const bcrypt = require('bcryptjs');

async function debugAdminPassword() {
  const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
  
  console.log('Fetching clinic data...');
  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .maybeSingle();
  
  if (error || !clinic) {
    console.error('Error fetching clinic:', error);
    return;
  }
  
  console.log('\nClinic data:');
  console.log('- ID:', clinic.id);
  console.log('- Name:', clinic.name);
  console.log('- Email:', clinic.email);
  console.log('- is_first_login:', clinic.is_first_login);
  console.log('- admin_password_changed:', clinic.admin_password_changed);
  console.log('- password field exists:', clinic.password ? 'YES' : 'NO');
  console.log('- password value:', clinic.password ? '(hashed)' : 'NULL');
  console.log('- owners_info:', clinic.owners_info);
  
  // Try to verify password "12345"
  const testPassword = '12345';
  console.log(`\nTesting password: "${testPassword}"`);
  
  // Check stored password
  let storedHash = null;
  if (clinic.password) {
    storedHash = clinic.password;
  } else if (clinic.owners_info && clinic.owners_info.auth?.password_hash) {
    storedHash = clinic.owners_info.auth.password_hash;
  }
  
  console.log('\nStored hash:', storedHash ? '(exists)' : 'NULL');
  if (storedHash) {
    console.log('- First 10 chars:', storedHash.substring(0, 10));
    console.log('- Starts with $2:', storedHash.startsWith('$2'));
    
    if (storedHash.startsWith('$2')) {
      console.log('\nVerifying with bcrypt...');
      try {
        const matches = await bcrypt.compare(testPassword, storedHash);
        console.log('- bcrypt.compare result:', matches);
      } catch (err) {
        console.log('- bcrypt.compare error:', err.message);
      }
    } else {
      console.log('\nVerifying with plain string comparison...');
      const matches = testPassword === storedHash;
      console.log('- String comparison result:', matches);
    }
  }
  
  // Check if default password is allowed
  console.log('\nisDefaultLoginAllowed check:');
  console.log('- is_first_login:', clinic.is_first_login);
  const DEFAULT_ADMIN_EMAIL = 'agabafelix90@gmail.com';
  const DEFAULT_ADMIN_PASSWORD = '12345';
  const usingGlobalDefault = clinic.email === DEFAULT_ADMIN_EMAIL && testPassword === DEFAULT_ADMIN_PASSWORD;
  const usingClinicDefault = testPassword === DEFAULT_ADMIN_PASSWORD;
  const defaultAllowed = (usingGlobalDefault || usingClinicDefault) && clinic.is_first_login === true;
  console.log('- usingGlobalDefault:', usingGlobalDefault);
  console.log('- usingClinicDefault:', usingClinicDefault);
  console.log('- defaultAllowed:', defaultAllowed);
}

debugAdminPassword().catch(console.error).finally(() => process.exit(0));
