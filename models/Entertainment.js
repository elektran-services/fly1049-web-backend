const mongoose = require('mongoose');

const entertainmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    category: { type: String, default: 'entertainment' },
    author: { type: String, default: 'Fly 104.9 Team' },
    publishedDate: { type: Date, default: Date.now },
    imageUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entertainment', entertainmentSchema);
