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

    IF OBJECT_ID(N'dbo.SiteSettings', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SiteSettings (
        Id INT IDENTITY(1, 1) PRIMARY KEY,
        HeaderJson NVARCHAR(MAX) NOT NULL,
        FooterJson NVARCHAR(MAX) NOT NULL,
        HeroJson NVARCHAR(MAX) NOT NULL,
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

  const siteSettingsCount = await pool.request().query(`
    SELECT COUNT(1) AS total
    FROM dbo.SiteSettings;
  `);

  if (siteSettingsCount.recordset[0].total === 0) {
    await pool.request()
      .input('headerJson', sql.NVarChar(sql.MAX), JSON.stringify({
        logoText: 'TS',
        brandName: 'THE SWAN ATELIERE',
        tagline: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị'
      }))
      .input('footerJson', sql.NVarChar(sql.MAX), JSON.stringify({
        title: 'Thông tin liên hệ',
        description: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị',
        phone: '0909480231',
        email: 'hello@theswanateliere.vn',
        branchAddresses: [
          'Chi nhánh 1: 436 Võ Văn Tần, phường Bàn Cờ, TP.HCM',
          'Chi nhánh 2: 38 Trần Quang Diệu, phường Nhiêu Lộc, TP.HCM'
        ]
      }))
      .input('heroJson', sql.NVarChar(sql.MAX), JSON.stringify({
        eyebrow: 'Thời trang thiết kế nữ',
        title: 'THE SWAN ATELIERE mang đến những thiết kế dành cho nữ trẻ yêu sự thanh lịch và hiện đại',
        description:
          'Hướng đến khách hàng nữ từ 16 đến 30 tuổi, THE SWAN ATELIERE phát triển các thiết kế dễ mặc, dễ phối và đủ tinh tế để đồng hành cùng nhiều khoảnh khắc trong đời sống hằng ngày.',
        primaryButtonLabel: 'Nhận tư vấn ngay',
        primaryButtonRoute: '/lien-he',
        secondaryButtonLabel: 'Xem dịch vụ',
        secondaryButtonRoute: '/dich-vu',
        cardLabel: 'Tổng quan nhanh',
        cardTitle: 'THE SWAN ATELIERE',
        cardDescription: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị',
        highlights: [
          'Thành lập từ năm 2020',
          'Bán lẻ thời trang thiết kế nữ',
          '2 chi nhánh tại TP.HCM'
        ]
      }))
      .query(`
        INSERT INTO dbo.SiteSettings (HeaderJson, FooterJson, HeroJson)
        VALUES (@headerJson, @footerJson, @heroJson);
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
