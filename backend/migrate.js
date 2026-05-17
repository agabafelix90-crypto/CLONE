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

// If a DATABASE_URL environment variable is provided, apply migration files directly using pg
if (process.env.DATABASE_URL) {
  const { Client } = require('pg');
  (async () => {
    let client;
    try {
      console.log('🔌 DATABASE_URL detected — applying migration files automatically');
      client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();

      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.existsSync(migrationsDir)
        ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
        : [];

      if (migrationFiles.length === 0) {
        throw new Error('No migration files found in the migrations directory');
      }

      await client.query('BEGIN');
      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(migrationsDir, migrationFile);
        console.log(`📄 Applying migration: ${migrationFile}`);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migrationSQL);
      }
      await client.query('COMMIT');
      console.log('✅ Migration files applied successfully via DATABASE_URL');
      await client.end();
    } catch (err) {
      console.error('❌ Failed to apply migration via DATABASE_URL:', err);
      if (client) {
        try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
        await client.end();
      }
      process.exit(1);
    }
  })();
}