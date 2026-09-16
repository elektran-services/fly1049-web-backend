const express = require('express');
const Settings = require('../models/Settings');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_SETTINGS = {
  addressLines: [
    'Along Aramoko Road',
    'Erijiyan, Ekiti State',
    'Nigeria'
  ],
  studioPhone: '09064271740',
  whatsapp: ['09064271740', '08034349139'],
  social: {
    facebook: 'https://www.facebook.com/FLY1049FM/',
    instagram: 'https://www.instagram.com/fly104.9fm/',
    youtube: 'https://www.youtube.com/@Fly104.9fm'
  },
  heroPhrases: [
    'Fly 104.9 FM',
    "Ekiti's Hottest Radio Station"
  ],
  streams: {
    audio: process.env.AUDIO_STREAM_URL || '',
    video: process.env.VIDEO_STREAM_URL || ''
  }
};

function toClient(doc) {
  const obj = doc?.toObject ? doc.toObject() : (doc || {});
  return {
    addressLines: obj.addressLines || [],
    studioPhone: obj.studioPhone || '',
    whatsapp: obj.whatsapp || [],
    social: obj.social || {},
    heroPhrases: obj.heroPhrases || [],
    streams: obj.streams || { audio: '', video: '' }
  };
}

async function getSettingsDoc() {
  let doc = await Settings.findOne({ key: 'site' });
  if (!doc) {
    doc = await Settings.create({ key: 'site', ...DEFAULT_SETTINGS });
  }
  return doc;
}

router.get('/', async (_req, res) => {
  try {
    const doc = await getSettingsDoc();
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings', message: err.message });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const doc = await getSettingsDoc();
    if (Array.isArray(req.body.addressLines)) {
      doc.addressLines = req.body.addressLines.filter(Boolean);
    }
    if (req.body.studioPhone !== undefined) doc.studioPhone = req.body.studioPhone;
    if (Array.isArray(req.body.whatsapp)) {
      doc.whatsapp = req.body.whatsapp.filter(Boolean);
    }
    if (req.body.social) {
      doc.social = { ...doc.social.toObject?.() || doc.social, ...req.body.social };
    }
    if (Array.isArray(req.body.heroPhrases)) {
      doc.heroPhrases = req.body.heroPhrases.map((p) => String(p).trim()).filter(Boolean);
    }
    if (req.body.streams) {
      doc.streams = { ...doc.streams.toObject?.() || doc.streams, ...req.body.streams };
    }
    await doc.save();
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings', message: err.message });
  }
});

module.exports = router;
