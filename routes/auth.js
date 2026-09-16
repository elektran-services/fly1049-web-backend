const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const password = (req.body?.password || '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.session.isAdmin = true;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
    res.json({ ok: true, message: 'Logged in' });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true, message: 'Logged out' });
  });
});

router.get('/me', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

module.exports = router;
