const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (name.length > 120 || subject.length > 200 || message.length > 5000) {
      return res.status(400).json({ error: 'One or more fields are too long.' });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'Email service is not configured. Please contact the station by phone or WhatsApp.'
      });
    }

    const to = process.env.CONTACT_TO || 'info@fly1049fm.com';
    const from = process.env.CONTACT_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"Fly 104.9 FM Website" <${from}>`,
      to,
      replyTo: `"${name}" <${email}>`,
      subject: `[Website Contact] ${subject}`,
      text: [
        'New message from the Fly 104.9 FM website contact form.',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        '',
        'Message:',
        message
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin:0 0 12px;">New website contact message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
          <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      `
    });

    res.json({ ok: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact email failed:', err.message);
    res.status(500).json({
      error: 'Unable to send your message right now. Please try again later.'
    });
  }
});

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
