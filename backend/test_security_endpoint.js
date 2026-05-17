require('dotenv').config();
const http = require('http');

// Make a POST request to test the backend security endpoint
const clinicId = '743da65d-683d-499a-8760-a051014436cc';

const data = JSON.stringify({ token: clinicId });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/clinic/security',  // or '/security', need to find the right path
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

console.log('Testing backend security endpoint...');
console.log('Sending token:', clinicId);

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  
  // Try alternative paths
  console.log('\nTrying alternative path: /security...');
  const options2 = { ...options, path: '/security' };
  const req2 = http.request(options2, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:');
      try {
        console.log(JSON.stringify(JSON.parse(body), null, 2));
      } catch (e) {
        console.log(body);
      }
      process.exit(0);
    });
  });
  req2.on('error', (err) => console.error('Second request error:', err.message));
  req2.write(data);
  req2.end();
});

req.write(data);
req.end();
