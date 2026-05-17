const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key);
(async () => {
  const token = '3d54926a-fbc3-4ee2-8e5c-8efb31c07023';
  const { data, error } = await supabase.from('clinics').select('*').eq('id', token).maybeSingle();
  console.log('clinic data:', data);
  console.log('error:', error);
})();
