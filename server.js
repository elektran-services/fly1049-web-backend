const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const { connectDB } = require('./lib/db');
const { seedIfEmpty } = require('./lib/seed');
const { uploadsDir } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 6001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fly1049-dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12
  }
}));

app.use('/uploads', express.static(uploadsDir));

const newsRoutes = require('./routes/news');
const entertainmentRoutes = require('./routes/entertainment');
const streamRoutes = require('./routes/stream');
const scheduleRoutes = require('./routes/schedule');
const settingsRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

app.use('/api/news', newsRoutes);
app.use('/api/entertainment', entertainmentRoutes);
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stream', streamRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Fly 104.9 FM API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Fly 104.9 FM API',
    version: '1.1.0',
    endpoints: {
      health: '/api/health',
      news: '/api/news',
      entertainment: '/api/entertainment',
      stream: '/api/stream',
      schedule: '/api/schedule',
      settings: '/api/settings',
      auth: '/api/auth',
      contact: '/api/contact',
      uploads: '/uploads',
      posts: '/api/posts',
      admin: '/admin'
    }
  });
});

const adminDir = path.join(__dirname, 'admin');

app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminDir, 'index.html'));
});

app.use('/admin', express.static(adminDir));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

async function start() {
  try {
    await connectDB();
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`Fly 104.9 FM API Server running on port ${PORT}`);
      console.log(`Admin portal: http://localhost:${PORT}/admin`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
