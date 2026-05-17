require('dotenv').config();
const { supabase } = require('./src/lib/supabaseClient');

(async () => {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'clinics');
  if (error) {
    console.error('Error querying information_schema.columns:', error);
    process.exit(1);
  }
  console.log('Clinic columns:', data.map((row) => row.column_name).join(', '));
  process.exit(0);
})();
