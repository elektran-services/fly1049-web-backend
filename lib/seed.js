const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const News = require('../models/News');
const Entertainment = require('../models/Entertainment');
const Settings = require('../models/Settings');

function readSeed(name) {
  try {
    const file = path.join(__dirname, '..', 'data', name);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function mapLegacyDoc(doc, section) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    title: obj.title,
    excerpt: obj.excerpt || '',
    content: obj.content || '',
    category: obj.category || section,
    author: obj.author || 'Fly 104.9 Team',
    publishedDate: obj.publishedDate ? new Date(obj.publishedDate) : new Date(),
    imageUrl: obj.imageUrl || '',
    featured: !!obj.featured,
    section
  };
}

async function seedIfEmpty() {
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    const toInsert = [];

    const legacyNews = await News.find().lean();
    legacyNews.forEach((doc) => toInsert.push(mapLegacyDoc(doc, 'news')));

    const legacyEnt = await Entertainment.find().lean();
    legacyEnt.forEach((doc) => toInsert.push(mapLegacyDoc(doc, 'entertainment')));

    if (!toInsert.length) {
      const newsSeed = readSeed('news.json');
      if (Array.isArray(newsSeed)) {
        newsSeed.forEach(({ id, ...rest }) => {
          toInsert.push(mapLegacyDoc(rest, 'news'));
        });
      }

      const entSeed = readSeed('entertainment.json');
      if (Array.isArray(entSeed)) {
        entSeed.forEach(({ id, ...rest }) => {
          toInsert.push(mapLegacyDoc(rest, 'entertainment'));
        });
      }
    }

    if (toInsert.length) {
      await Post.insertMany(toInsert);
      console.log(`Seeded ${toInsert.length} posts into unified collection`);
    }
  }

  const existingSettings = await Settings.findOne({ key: 'site' });
  if (!existingSettings) {
    const seed = readSeed('settings.json') || {};
    await Settings.create({
      key: 'site',
      addressLines: seed.addressLines || [],
      studioPhone: seed.studioPhone || '',
      whatsapp: seed.whatsapp || [],
      social: seed.social || {},
      heroPhrases: seed.heroPhrases || [],
      streams: {
        audio: seed.streams?.audio || process.env.AUDIO_STREAM_URL || '',
        video: seed.streams?.video || process.env.VIDEO_STREAM_URL || ''
      }
    });
    console.log('Seeded site settings');
  }
}

module.exports = { seedIfEmpty };
