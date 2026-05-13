#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Database migration script');
  console.log('📄 Reading schema file...');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Schema SQL:');
    console.log('=' .repeat(50));
    console.log(schemaSQL);
    console.log('=' .repeat(50));
    console.log('');
    console.log('📝 To run this migration:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the above SQL');
    console.log('4. Click "Run" to execute');
    console.log('');
    console.log('✅ This will create the clinics and employees tables');

  } catch (error) {
    console.error('❌ Failed to read schema file:', error);
    process.exit(1);
  }
}

runMigration();