const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabaseUrl = 'https://jzfdxstpomdcoucywimy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZmR4c3Rwb21kY291Y3l3aW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTEyMSwiZXhwIjoyMDkzNjA1MTIxfQ.3PyTy51vHAs_Gv_UEt0_dE2-me78l4jUgly30h853nE';
const clinicId = '47b8dd61-085d-451d-a166-f0db2c79d4fe';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Clinic ID:', clinicId);
    console.log('Querying existing drug count...');
    let { count: beforeCount, error: beforeError } = await supabase
      .from('drugs')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    console.log('Before drug count:', beforeCount, 'error:', beforeError && beforeError.message);

    console.log('Inserting onboarding drug...');
    const { data, error } = await supabase.from('drugs').insert([{
      clinic_id: clinicId,
      name: 'Onboarding Drug',
      generic_name: 'Onboarding',
      description: 'Auto-created onboarding drug',
      dosage_form: 'tablet',
      strength: '10mg',
      manufacturer: 'ClinicPro',
      cost_price: 1.00,
      selling_price: 2.00,
      status: 'active'
    }]).select();

    if (error) {
      console.error('Insert error:', error);
      return;
    }
    console.log('Inserted drug:', data);

    const { count: afterCount } = await supabase
      .from('drugs')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);
    console.log('After drug count:', afterCount);

    console.log('Requesting finishOnboarding.php...');
    const postData = JSON.stringify({ token: clinicId });
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/finishOnboarding.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        console.log('FinishOnboarding status:', res.statusCode);
        try {
          console.log('Response:', JSON.stringify(JSON.parse(responseData), null, 2));
        } catch (err) {
          console.log('Raw response:', responseData);
        }
      });
    });
    req.on('error', (err) => {
      console.error('HTTP request error:', err);
    });
    req.write(postData);
    req.end();

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
