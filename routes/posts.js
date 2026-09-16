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

router.get('/', async (req, res) => {
  try {
    const items = await listPosts(req.query);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts', message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await getPost(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(404).json({ error: 'Post not found' });
  }
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const post = await createPost(req.body, req.file);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post', message: err.message });
  }
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const post = await updatePost(req.params.id, req.body, req.file);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post', message: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await deletePost(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted', post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post', message: err.message });
  }
});

module.exports = router;
