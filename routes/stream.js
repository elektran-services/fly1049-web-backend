const express = require('express');
const { readJson } = require('../lib/dataStore');
const Settings = require('../models/Settings');
const router = express.Router();

router.get('/urls', async (_req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'site' });
    const streams = settings?.streams || {};
    res.json({
      audio: streams.audio || process.env.AUDIO_STREAM_URL || '',
      video: streams.video || process.env.VIDEO_STREAM_URL || ''
    });
  } catch {
    const settings = readJson('settings.json', {}) || {};
    res.json({
      audio: settings.streams?.audio || process.env.AUDIO_STREAM_URL || '',
      video: settings.streams?.video || process.env.VIDEO_STREAM_URL || ''
    });
  }
});

router.get('/now-and-next', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(process.env.NOW_AND_NEXT_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching now and next:', error.message);
    res.status(500).json({
      error: 'Failed to fetch now and next data',
      message: error.message
    });
  }
});

module.exports = router;
