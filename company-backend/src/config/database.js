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
        Excerpt NVARCHAR(500) NULL,
        Content NVARCHAR(MAX) NOT NULL,
        ImagePath NVARCHAR(500) NULL,
        ImagePublicId NVARCHAR(255) NULL,
        VideoPath NVARCHAR(500) NULL,
        VideoPublicId NVARCHAR(255) NULL,
        SeoTitle NVARCHAR(200) NULL,
        SeoDescription NVARCHAR(320) NULL,
        IsPublished BIT NOT NULL DEFAULT 1,
        IsFeatured BIT NOT NULL DEFAULT 0,
        PublishedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;

    IF COL_LENGTH(N'dbo.Posts', N'Excerpt') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD Excerpt NVARCHAR(500) NULL;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'SeoTitle') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD SeoTitle NVARCHAR(200) NULL;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'ImagePublicId') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD ImagePublicId NVARCHAR(255) NULL;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'VideoPublicId') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD VideoPublicId NVARCHAR(255) NULL;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'SeoDescription') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD SeoDescription NVARCHAR(320) NULL;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'IsPublished') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD IsPublished BIT NOT NULL
      CONSTRAINT DF_Posts_IsPublished DEFAULT 1;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'IsFeatured') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD IsFeatured BIT NOT NULL
      CONSTRAINT DF_Posts_IsFeatured DEFAULT 0;
    END;

    IF COL_LENGTH(N'dbo.Posts', N'PublishedAt') IS NULL
    BEGIN
      ALTER TABLE dbo.Posts
      ADD PublishedAt DATETIME2 NULL;
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

  await pool.request().batch(`
    UPDATE dbo.Posts
    SET IsPublished = 1
    WHERE IsPublished IS NULL;

    UPDATE dbo.Posts
    SET IsFeatured = 0
    WHERE IsFeatured IS NULL;

    UPDATE dbo.Posts
    SET PublishedAt = COALESCE(PublishedAt, UpdatedAt, CreatedAt)
    WHERE IsPublished = 1 AND PublishedAt IS NULL;

    UPDATE dbo.Posts
    SET Excerpt = LEFT(Content, 220)
    WHERE Excerpt IS NULL OR LTRIM(RTRIM(Excerpt)) = N'';

    UPDATE dbo.Posts
    SET SeoTitle = Title
    WHERE SeoTitle IS NULL OR LTRIM(RTRIM(SeoTitle)) = N'';

    UPDATE dbo.Posts
    SET SeoDescription = LEFT(COALESCE(NULLIF(Excerpt, N''), Content), 320)
    WHERE SeoDescription IS NULL OR LTRIM(RTRIM(SeoDescription)) = N'';
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
