const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ftgumrfflybrfqzniwqd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z3VtcmZmbHlicmZxem5pd3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkyMjQ0MjMsImV4cCI6MTk4NDgwMDQyM30.m-vDxTN2b8pjM0d3HVLj9KmCAm8SV6qVsWR1AYzPBbo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePassword() {
  const { data, error } = await supabase
    .from('clinics')
    .update({ password: '123456' })
    .eq('name', 'AGABA')
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated:', data);
  }
}

updatePassword();
