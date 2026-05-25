const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

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
