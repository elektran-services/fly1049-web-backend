const Post = require('../models/Post');

function toClient(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    title: obj.title,
    excerpt: obj.excerpt,
    content: obj.content,
    category: obj.category,
    author: obj.author,
    publishedDate: obj.publishedDate,
    imageUrl: obj.imageUrl || '',
    featured: !!obj.featured,
    section: obj.section || 'news'
  };
}

function parseFeatured(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === 'on' || value === '1';
}

function parseSection(value, fallback = 'news') {
  const section = String(value || fallback).toLowerCase();
  return section === 'entertainment' ? 'entertainment' : 'news';
}

async function listPosts({ section, category, featured, limit, skip } = {}) {
  const filter = {};
  if (section) filter.section = parseSection(section);
  if (category) filter.category = category;
  if (featured === 'true' || featured === true) filter.featured = true;

  let query = Post.find(filter).sort({ publishedDate: -1 });
  const skipCount = skip ? parseInt(skip, 10) : 0;
  if (skipCount > 0) query = query.skip(skipCount);
  if (limit) query = query.limit(parseInt(limit, 10));
  const items = await query.exec();
  return items.map(toClient);
}

async function getPost(id) {
  const post = await Post.findById(id);
  return toClient(post);
}

async function createPost(body, file) {
  const imageUrl = file
    ? `/uploads/${file.filename}`
    : (body.imageUrl || '');

  const post = await Post.create({
    title: body.title || 'Untitled',
    excerpt: body.excerpt || '',
    content: body.content || '',
    category: body.category || 'news',
    author: body.author || 'Fly 104.9 Team',
    publishedDate: new Date(),
    imageUrl,
    featured: !!parseFeatured(body.featured),
    section: parseSection(body.section, 'news')
  });

  return toClient(post);
}

async function updatePost(id, body, file) {
  const post = await Post.findById(id);
  if (!post) return null;

  if (body.title !== undefined) post.title = body.title;
  if (body.excerpt !== undefined) post.excerpt = body.excerpt;
  if (body.content !== undefined) post.content = body.content;
  if (body.category !== undefined) post.category = body.category;
  if (body.author !== undefined) post.author = body.author;
  if (body.section !== undefined) post.section = parseSection(body.section, post.section);

  if (file) {
    post.imageUrl = `/uploads/${file.filename}`;
  } else if (body.imageUrl !== undefined) {
    post.imageUrl = body.imageUrl;
  }

  const featured = parseFeatured(body.featured);
  if (featured !== undefined) post.featured = featured;

  await post.save();
  return toClient(post);
}

async function deletePost(id) {
  const post = await Post.findByIdAndDelete(id);
  return toClient(post);
}

module.exports = {
  toClient,
  parseSection,
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
};
