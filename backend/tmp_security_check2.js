const http = require('http');
const data = JSON.stringify({ token: '3d54926a-fbc3-4ee2-8e5c-8efb31c07023' });
const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/security.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log(res.statusCode);
    console.log(body);
  });
});
req.on('error', (err) => {
  console.error('request error', err);
});
req.write(data);
req.end();
