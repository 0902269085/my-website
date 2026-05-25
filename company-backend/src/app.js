const express = require('express');
const cors = require('cors');

const { env } = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Backend Node.js đang chạy',
    docs: {
      health: '/api/health',
      database: '/api/health/database',
      contact: '/api/contact'
    }
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/contact', contactRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      ok: false,
      message: 'Dữ liệu gửi lên chưa đúng định dạng. Vui lòng thử lại.'
    });
  }

  return next(error);
});

module.exports = app;
