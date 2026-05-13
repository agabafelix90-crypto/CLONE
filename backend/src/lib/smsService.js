if (!global.fetch) {
  throw new Error('Global fetch is required for SMS requests. Use Node 18+ or install a fetch polyfill.');
}

const fetch = global.fetch;

function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.toString().trim();
  return digits.replace(/[^0-9+]/g, '');
}

function getGeniusCredentials() {
  const username = process.env.GENIUS_SMS_USERNAME || 'Felix';
  const password = process.env.GENIUS_SMS_PASSWORD || '7THW82P9A3R3PuU';
  const from = process.env.GENIUS_SMS_FROM || 'ClinicPro';

  return { username, password, from };
}

async function sendGeniusSMS({ phone, message }) {
  const to = normalizePhoneNumber(phone);
  if (!to) {
    throw new Error('Invalid phone number');
  }

  const { username, password, from } = getGeniusCredentials();
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('to', to);
  formData.append('message', message);
  formData.append('from', from);

  const response = await fetch('https://geniussmsgroup.com/api/v2/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = { status: responseText.includes('success') ? 'success' : 'error', message: responseText };
  }

  if (response.ok && (responseData.status === 'success' || responseData.status === 'OK' || responseText.toLowerCase().includes('success'))) {
    return { success: true, message: 'SMS sent successfully', raw: responseData };
  }

  return {
    success: false,
    message: responseData.message || responseText || 'Failed to send SMS',
    raw: responseData,
  };
}

module.exports = {
  sendGeniusSMS,
};