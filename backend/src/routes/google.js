const express = require('express');
const router = express.Router();
const { createCalendarEvent, sendEmail } = require('../lib/googleClient');

router.post('/calendar-event', async (req, res) => {
  try {
    const event = await createCalendarEvent(req.body);
    res.json({ success: true, event });
  } catch (error) {
    console.error('Google calendar error:', error?.message || error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to create event' });
  }
});

router.post('/send-email', async (req, res) => {
  try {
    const result = await sendEmail(req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Google email error:', error?.message || error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to send email' });
  }
});

module.exports = router;
