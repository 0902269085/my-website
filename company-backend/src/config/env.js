require('dotenv').config();

function buildAllowedOrigins(frontendUrl, allowedOriginsValue) {
  const allowedOrigins = new Set();

  if (frontendUrl) {
    allowedOrigins.add(frontendUrl);
  }

  const manualOrigins = (allowedOriginsValue || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of manualOrigins) {
    allowedOrigins.add(origin);
  }

  if (frontendUrl === 'http://localhost:4200') {
    allowedOrigins.add('http://127.0.0.1:4200');
  }

  if (frontendUrl === 'http://127.0.0.1:4200') {
    allowedOrigins.add('http://localhost:4200');
  }

  return [...allowedOrigins];
}

const env = {
  port: Number(process.env.PORT || 3000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  allowedOrigins: buildAllowedOrigins(
    process.env.FRONTEND_URL || 'http://localhost:4200',
    process.env.ALLOWED_ORIGINS || ''
  ),
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'change-this-admin-secret',
  adminDefaultUsername: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe123!',
  db: {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || 'VibeWebsiteDb',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
    }
  }
};

module.exports = { env };
