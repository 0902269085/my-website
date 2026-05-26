const jwt = require('jsonwebtoken');

const { env } = require('../config/env');

function readBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

function verifyAdminToken(req, res, next) {
  const token = readBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: 'Bạn cần đăng nhập để tiếp tục.'
    });
  }

  try {
    req.adminUser = jwt.verify(token, env.adminJwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.'
    });
  }
}

module.exports = { verifyAdminToken };
