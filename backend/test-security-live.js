const http = require('http');

const clinicId = '743da65d-683d-499a-8760-a051014436cc';

const postData = JSON.stringify({ token: clinicId });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/security.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('\n=== Full Response ===');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      console.log('\n=== Key Onboarding Fields ===');
      console.log('isFirstLogin:', parsed.isFirstLogin);
      console.log('admin_password_changed:', parsed.admin_password_changed);
      console.log('employee_count:', parsed.employee_count);
      console.log('facilityConfigCount:', parsed.facilityConfigCount);
      console.log('canFinishOnboarding:', parsed.canFinishOnboarding);
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.error('Full error:', error);
});

console.log('Testing /security endpoint on localhost:4000');
console.log('Sending clinic ID:', clinicId);
console.log('');

req.write(postData);
req.end();
