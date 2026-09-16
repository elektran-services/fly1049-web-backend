const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
} = require('../lib/posts');

const router = express.Router();
const SECTION = 'news';

router.get('/', async (req, res) => {
  try {
    const items = await listPosts({ ...req.query, section: SECTION });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load news', message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await getPost(req.params.id);
    if (!post || post.section !== SECTION) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(404).json({ error: 'Article not found' });
  }
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const post = await createPost({ ...req.body, section: SECTION }, req.file);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create article', message: err.message });
  }
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const existing = await getPost(req.params.id);
    if (!existing || existing.section !== SECTION) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const post = await updatePost(req.params.id, { ...req.body, section: SECTION }, req.file);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update article', message: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await getPost(req.params.id);
    if (!existing || existing.section !== SECTION) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const post = await deletePost(req.params.id);
    res.json({ message: 'Article deleted', article: post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete article', message: err.message });
  }
});

module.exports = router;
