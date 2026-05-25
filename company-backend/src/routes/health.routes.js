const { Router } = require('express');
const { checkDatabaseConnection } = require('../config/database');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend dang hoat dong'
  });
});

router.get('/database', async (req, res) => {
  try {
    const result = await checkDatabaseConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Backend chưa kết nối được với nơi lưu dữ liệu.',
      error: error.message
    });
  }
});

module.exports = router;
