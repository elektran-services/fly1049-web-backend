const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get weekly schedule (proxied from Elektran NOA API)
router.get('/week', async (req, res) => {
  try {
    const response = await axios.get(process.env.WEEK_SCHEDULE_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weekly schedule:', error.message);
    res.status(500).json({
      error: 'Failed to fetch weekly schedule',
      message: error.message
    });
  }
});

// Get schedule for a specific day (e.g. /day/monday)
router.get('/day/:day', async (req, res) => {
  try {
    const response = await axios.get(process.env.WEEK_SCHEDULE_URL);
    const schedule = response.data?.schedule || {};
    const dayKey = Object.keys(schedule).find(
      key => key.toLowerCase() === req.params.day.toLowerCase()
    );

    if (!dayKey) {
      return res.status(404).json({ error: 'Schedule for specified day not found' });
    }

    res.json({
      day: dayKey,
      programs: schedule[dayKey]
    });
  } catch (error) {
    console.error('Error fetching day schedule:', error.message);
    res.status(500).json({
      error: 'Failed to fetch day schedule',
      message: error.message
    });
  }
});

module.exports = router;
