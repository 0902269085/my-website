const bcrypt = require('bcryptjs');
const sql = require('mssql');

const { env } = require('./env');

async function getConnectionPool() {
  const pool = new sql.ConnectionPool(env.db);
  await pool.connect();
  return pool;
}

async function ensureAdminCmsTables(pool) {
  await pool.request().batch(`
    IF OBJECT_ID(N'dbo.AdminUsers', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.AdminUsers (
        Id INT IDENTITY(1, 1) PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;

    IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Posts (
        Id INT IDENTITY(1, 1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Slug NVARCHAR(220) NOT NULL UNIQUE,
        Content NVARCHAR(MAX) NOT NULL,
        ImagePath NVARCHAR(500) NULL,
        VideoPath NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;
  `);

  const adminCount = await pool.request().query(`
    SELECT COUNT(1) AS total
    FROM dbo.AdminUsers;
  `);

  if (adminCount.recordset[0].total === 0) {
    const passwordHash = await bcrypt.hash(env.adminDefaultPassword, 10);

    await pool.request()
      .input('username', sql.NVarChar(100), env.adminDefaultUsername)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query(`
        INSERT INTO dbo.AdminUsers (Username, PasswordHash)
        VALUES (@username, @passwordHash);
      `);
  }
}

async function checkDatabaseConnection() {
  const pool = await getConnectionPool();

  try {
    await pool.request().query('SELECT 1 AS ok');

    return {
      ok: true,
      message: 'Backend đã kết nối được với nơi lưu dữ liệu.'
    };
  } finally {
    await pool.close();
  }
}

module.exports = {
  checkDatabaseConnection,
  ensureAdminCmsTables,
  getConnectionPool,
  sql
};
