const { google } = require('googleapis');

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const googleCalendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

const hasGoogleCredentials = Boolean(clientEmail && privateKey);

if (!hasGoogleCredentials) {
  console.warn('Google API credentials are not fully configured. Google routes will fail until credentials are provided.');
}

const auth = hasGoogleCredentials ? new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey
  },
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send'
  ]
}) : null;

const calendar = hasGoogleCredentials ? google.calendar({ version: 'v3', auth }) : null;
const gmail = hasGoogleCredentials ? google.gmail({ version: 'v1', auth }) : null;

function ensureGoogleConfigured() {
  if (!hasGoogleCredentials) {
    throw new Error('Google API credentials are not configured. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in backend/.env.');
  }
}

async function createCalendarEvent({ summary, description, startDateTime, endDateTime, attendees = [] }) {
  ensureGoogleConfigured();
  const response = await calendar.events.insert({
    calendarId: googleCalendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      attendees: attendees.map(email => ({ email }))
    }
  });
  return response.data;
}

async function sendEmail({ to, subject, message }) {
  ensureGoogleConfigured();
  const raw = Buffer.from(
    `From: ${clientEmail}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    `${message}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw
    }
  });
  return response.data;
}

module.exports = {
  createCalendarEvent,
  sendEmail
};
