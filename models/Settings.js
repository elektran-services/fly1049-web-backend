const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    addressLines: { type: [String], default: [] },
    studioPhone: { type: String, default: '' },
    whatsapp: { type: [String], default: [] },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' }
    },
    heroPhrases: { type: [String], default: [] },
    streams: {
      audio: { type: String, default: '' },
      video: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
