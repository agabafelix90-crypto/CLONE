#!/usr/bin/env node

// Check which password matches the stored hash

const { supabase } = require('./src/lib/supabaseClient');
const bcrypt = require('bcryptjs');

async function findMatchingPassword() {
  const clinicId = 'a7d1d753-4d70-4db5-9596-12a8230d0ea6';
  
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .maybeSingle();
  
  if (!clinic || !clinic.owners_info?.auth?.password_hash) {
    console.log('No password hash found');
    return;
  }
  
  const hash = clinic.owners_info.auth.password_hash;
  console.log('Stored hash:', hash);
  console.log('Stored hash first 10 chars:', hash.substring(0, 10));
  console.log();
  
  // Test common passwords
  const testPasswords = [
    '12345',
    'password',
    'admin',
    'clinic',
    'Clinic123',
    'Admin@123',
    'admin@123',
    '',
    'test',
    'test123',
    'Mulago',
    'Health',
    'Plus'
  ];
  
  console.log('Testing common passwords...\n');
  
  for (const pwd of testPasswords) {
    try {
      const matches = await bcrypt.compare(pwd, hash);
      console.log(`"${pwd}": ${matches ? 'MATCH ✓' : 'no match'}`);
    } catch (err) {
      console.log(`"${pwd}": error - ${err.message}`);
    }
  }
  
  console.log('\nNote: If none match, the hash might be corrupted or created with a different method.');
}

findMatchingPassword().catch(console.error).finally(() => process.exit(0));
