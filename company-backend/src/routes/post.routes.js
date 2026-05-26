const { Router } = require('express');

const { ensureAdminCmsTables, getConnectionPool, sql } = require('../config/database');

const router = Router();

function normalizeNumber(value, fallbackValue) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function buildExcerpt(content, excerpt) {
  if (excerpt) {
    return excerpt;
  }

  return content.slice(0, 220);
}

function mapPostSummary(record) {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    excerpt: buildExcerpt(record.content, record.excerpt),
    imagePath: record.imagePath,
    publishedAt: record.publishedAt,
    isFeatured: Boolean(record.isFeatured)
  };
}

function mapPostDetail(record) {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    excerpt: buildExcerpt(record.content, record.excerpt),
    content: record.content,
    imagePath: record.imagePath,
    videoPath: record.videoPath,
    seoTitle: record.seoTitle || record.title,
    seoDescription: record.seoDescription || buildExcerpt(record.content, record.excerpt),
    publishedAt: record.publishedAt,
    isFeatured: Boolean(record.isFeatured)
  };
}

router.get('/', async (req, res) => {
  const limit = normalizeNumber(req.query.limit, 0);
  const featuredOnly = req.query.featured === 'true';

  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const request = pool.request();
    const topClause = limit ? `TOP (${limit})` : '';
    const featuredClause = featuredOnly ? 'AND IsFeatured = 1' : '';

    const result = await request.query(`
      SELECT ${topClause}
        Id AS id,
        Title AS title,
        Slug AS slug,
        Excerpt AS excerpt,
        Content AS content,
        ImagePath AS imagePath,
        PublishedAt AS publishedAt,
        IsFeatured AS isFeatured
      FROM dbo.Posts
      WHERE IsPublished = 1
      ${featuredClause}
      ORDER BY IsFeatured DESC, COALESCE(PublishedAt, UpdatedAt, CreatedAt) DESC, Id DESC;
    `);

    return res.json({
      ok: true,
      message: 'Đã lấy danh sách bài viết công khai.',
      data: result.recordset.map(mapPostSummary)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa lấy được danh sách bài viết công khai.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

router.get('/:slug', async (req, res) => {
  const slug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';

  if (!slug) {
    return res.status(400).json({
      ok: false,
      message: 'Đường dẫn bài viết chưa hợp lệ.'
    });
  }

  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const result = await pool.request()
      .input('slug', sql.NVarChar(220), slug)
      .query(`
        SELECT TOP 1
          Id AS id,
          Title AS title,
          Slug AS slug,
          Excerpt AS excerpt,
          Content AS content,
          ImagePath AS imagePath,
          VideoPath AS videoPath,
          SeoTitle AS seoTitle,
          SeoDescription AS seoDescription,
          PublishedAt AS publishedAt,
          IsFeatured AS isFeatured
        FROM dbo.Posts
        WHERE IsPublished = 1 AND Slug = @slug;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Không tìm thấy bài viết công khai.'
      });
    }

    return res.json({
      ok: true,
      message: 'Đã lấy chi tiết bài viết.',
      data: mapPostDetail(result.recordset[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa lấy được chi tiết bài viết.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

module.exports = router;
