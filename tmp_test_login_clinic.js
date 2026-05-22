const fetch = require('node-fetch');
(async () => {
  const response = await fetch('http://localhost:4000/loginClinic.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clinicName: 'DEVINE CARE MEDICAL CENTER', password: '8017' }),
  });
  const data = await response.json();
  console.log('status', response.status);
  console.log(JSON.stringify(data, null, 2));
})();
