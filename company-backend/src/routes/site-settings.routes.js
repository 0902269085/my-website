const { Router } = require('express');

const { ensureAdminCmsTables, getConnectionPool, sql } = require('../config/database');

const router = Router();

function getDefaultSiteSettings() {
  return {
    header: {
      logoText: 'TS',
      brandName: 'THE SWAN ATELIERE',
      tagline: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị'
    },
    footer: {
      title: 'Thông tin liên hệ',
      description: 'Thời trang thiết kế nữ thanh lịch, hiện đại và tinh tế cho nhịp sống đô thị',
      phone: '0909480231',
      email: 'hello@theswanateliere.vn',
      branchAddresses: [
        'Chi nhánh 1: 436 Võ Văn Tần, phường Bàn Cờ, TP.HCM',
        'Chi nhánh 2: 38 Trần Quang Diệu, phường Nhiêu Lộc, TP.HCM'
      ]
    },
    hero: {
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
    }
  };
}

function parseJsonValue(rawValue, fallbackValue) {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

async function getSiteSettingsRecord(pool) {
  await ensureAdminCmsTables(pool);

  const result = await pool.request().query(`
    SELECT TOP 1
      Id AS id,
      HeaderJson AS headerJson,
      FooterJson AS footerJson,
      HeroJson AS heroJson,
      UpdatedAt AS updatedAt
    FROM dbo.SiteSettings
    ORDER BY Id ASC;
  `);

  return result.recordset[0];
}

function mapSiteSettings(record) {
  const defaults = getDefaultSiteSettings();

  return {
    header: {
      ...defaults.header,
      ...parseJsonValue(record?.headerJson, defaults.header)
    },
    footer: {
      ...defaults.footer,
      ...parseJsonValue(record?.footerJson, defaults.footer)
    },
    hero: {
      ...defaults.hero,
      ...parseJsonValue(record?.heroJson, defaults.hero)
    }
  };
}

router.get('/', async (req, res) => {
  let pool;

  try {
    pool = await getConnectionPool();
    const record = await getSiteSettingsRecord(pool);

    return res.json({
      ok: true,
      message: 'Đã lấy cấu hình giao diện website.',
      data: mapSiteSettings(record)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa lấy được cấu hình giao diện website.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

module.exports = {
  getDefaultSiteSettings,
  getSiteSettingsRecord,
  mapSiteSettings,
  router
};
