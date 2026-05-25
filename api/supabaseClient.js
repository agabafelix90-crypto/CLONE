const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

try {
  const functions = require('firebase-functions');
  const firebaseConfig = functions.config?.().supabase || {};
  supabaseUrl = supabaseUrl || firebaseConfig.url;
  supabaseKey = supabaseKey || firebaseConfig.key;
} catch (error) {
  // Ignore when not running in Firebase Functions environment.
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.'
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY) {
  console.warn(
    'WARNING: SUPABASE_SERVICE_ROLE_KEY is missing; falling back to SUPABASE_ANON_KEY for server-side API routes.'
  );
}

module.exports = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
