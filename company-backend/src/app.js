const fs = require('fs');
const path = require('path');

const express = require('express');
const cors = require('cors');

const { env } = require('./config/env');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const contactRoutes = require('./routes/contact.routes');
const postRoutes = require('./routes/post.routes');
const { router: siteSettingsRoutes } = require('./routes/site-settings.routes');

const app = express();
const uploadsDirectory = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadsDirectory, { recursive: true });

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  }
}));

app.use('/uploads', express.static(uploadsDirectory));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Backend Node.js đang chạy',
    docs: {
      health: '/api/health',
      database: '/api/health/database',
      contact: '/api/contact',
      posts: '/api/posts',
      adminLogin: '/api/admin/login',
      adminPosts: '/api/admin/posts'
    }
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/admin', adminRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      ok: false,
      message: 'Dữ liệu gửi lên chưa đúng định dạng. Vui lòng thử lại.'
    });
  }

  if (error.message === 'Chỉ hỗ trợ file ảnh và video hợp lệ.') {
    return res.status(400).json({
      ok: false,
      message: error.message
    });
  }

  return next(error);
});

module.exports = app;
