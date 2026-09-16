const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    category: { type: String, default: 'news' },
    author: { type: String, default: 'Fly 104.9 Team' },
    publishedDate: { type: Date, default: Date.now },
    imageUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);
