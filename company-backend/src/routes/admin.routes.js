const fs = require('fs');
const path = require('path');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Router } = require('express');

const { ensureAdminCmsTables, getConnectionPool, sql } = require('../config/database');
const { env } = require('../config/env');
const { verifyAdminToken } = require('../middleware/admin-auth');
const {
  getDefaultSiteSettings,
  getSiteSettingsRecord,
  mapSiteSettings
} = require('./site-settings.routes');

const router = Router();
const uploadsDirectory = path.join(__dirname, '..', '..', 'uploads');

fs.mkdirSync(uploadsDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      callback(null, uploadsDirectory);
    },
    filename(req, file, callback) {
      const extension = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      callback(null, safeName);
    }
  }),
  fileFilter(req, file, callback) {
    if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }

    if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
      callback(null, true);
      return;
    }

    callback(new Error('Chỉ hỗ trợ file ảnh và video hợp lệ.'));
  }
});

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200);
}

function deleteUploadedFile(filePath) {
  if (!filePath) {
    return;
  }

  const absolutePath = path.join(uploadsDirectory, path.basename(filePath));

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

function buildStoredMediaPath(file) {
  return file ? `/uploads/${file.filename}` : null;
}

function createAdminToken(adminUser) {
  return jwt.sign(
    {
      id: adminUser.id,
      username: adminUser.username
    },
    env.adminJwtSecret,
    {
      expiresIn: '12h'
    }
  );
}

async function findAdminUserByUsername(pool, username) {
  const result = await pool.request()
    .input('username', sql.NVarChar(100), username)
    .query(`
      SELECT TOP 1
        Id AS id,
        Username AS username,
        PasswordHash AS passwordHash
      FROM dbo.AdminUsers
      WHERE Username = @username;
    `);

  return result.recordset[0];
}

function sanitizeSiteSettingsPayload(siteSettingsPayload) {
  const defaults = getDefaultSiteSettings();

  const header = siteSettingsPayload?.header || {};
  const footer = siteSettingsPayload?.footer || {};
  const hero = siteSettingsPayload?.hero || {};

  return {
    header: {
      logoText: normalizeText(header.logoText) || defaults.header.logoText,
      brandName: normalizeText(header.brandName) || defaults.header.brandName,
      tagline: normalizeText(header.tagline) || defaults.header.tagline
    },
    footer: {
      title: normalizeText(footer.title) || defaults.footer.title,
      description: normalizeText(footer.description) || defaults.footer.description,
      phone: normalizeText(footer.phone) || defaults.footer.phone,
      email: normalizeText(footer.email) || defaults.footer.email,
      branchAddresses: Array.isArray(footer.branchAddresses)
        ? footer.branchAddresses
            .map((item) => normalizeText(item))
            .filter(Boolean)
        : defaults.footer.branchAddresses
    },
    hero: {
      eyebrow: normalizeText(hero.eyebrow) || defaults.hero.eyebrow,
      title: normalizeText(hero.title) || defaults.hero.title,
      description: normalizeText(hero.description) || defaults.hero.description,
      primaryButtonLabel:
        normalizeText(hero.primaryButtonLabel) || defaults.hero.primaryButtonLabel,
      primaryButtonRoute:
        normalizeText(hero.primaryButtonRoute) || defaults.hero.primaryButtonRoute,
      secondaryButtonLabel:
        normalizeText(hero.secondaryButtonLabel) || defaults.hero.secondaryButtonLabel,
      secondaryButtonRoute:
        normalizeText(hero.secondaryButtonRoute) || defaults.hero.secondaryButtonRoute,
      cardLabel: normalizeText(hero.cardLabel) || defaults.hero.cardLabel,
      cardTitle: normalizeText(hero.cardTitle) || defaults.hero.cardTitle,
      cardDescription:
        normalizeText(hero.cardDescription) || defaults.hero.cardDescription,
      highlights: Array.isArray(hero.highlights)
        ? hero.highlights.map((item) => normalizeText(item)).filter(Boolean)
        : defaults.hero.highlights
    }
  };
}

router.post('/login', async (req, res) => {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.'
    });
  }

  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const adminUser = await findAdminUserByUsername(pool, username);

    if (!adminUser) {
      return res.status(401).json({
        ok: false,
        message: 'Tên đăng nhập hoặc mật khẩu chưa đúng.'
      });
    }

    const passwordMatches = await bcrypt.compare(password, adminUser.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        ok: false,
        message: 'Tên đăng nhập hoặc mật khẩu chưa đúng.'
      });
    }

    return res.json({
      ok: true,
      message: 'Đăng nhập quản trị thành công.',
      data: {
        token: createAdminToken(adminUser),
        user: {
          id: adminUser.id,
          username: adminUser.username
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa thể đăng nhập quản trị. Vui lòng thử lại.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

router.get('/session', verifyAdminToken, (req, res) => {
  return res.json({
    ok: true,
    message: 'Phiên quản trị đang hoạt động.',
    data: {
      user: {
        id: req.adminUser.id,
        username: req.adminUser.username
      }
    }
  });
});

router.get('/posts', verifyAdminToken, async (req, res) => {
  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Title AS title,
        Slug AS slug,
        Content AS content,
        ImagePath AS imagePath,
        VideoPath AS videoPath,
        CreatedAt AS createdAt,
        UpdatedAt AS updatedAt
      FROM dbo.Posts
      ORDER BY UpdatedAt DESC, Id DESC;
    `);

    return res.json({
      ok: true,
      message: 'Đã lấy danh sách bài viết.',
      data: result.recordset
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa lấy được danh sách bài viết.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

router.get('/site-settings', verifyAdminToken, async (req, res) => {
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

router.put('/site-settings', verifyAdminToken, async (req, res) => {
  const nextSettings = sanitizeSiteSettingsPayload(req.body);

  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const currentRecord = await getSiteSettingsRecord(pool);

    const result = await pool.request()
      .input('id', sql.Int, currentRecord.id)
      .input('headerJson', sql.NVarChar(sql.MAX), JSON.stringify(nextSettings.header))
      .input('footerJson', sql.NVarChar(sql.MAX), JSON.stringify(nextSettings.footer))
      .input('heroJson', sql.NVarChar(sql.MAX), JSON.stringify(nextSettings.hero))
      .query(`
        UPDATE dbo.SiteSettings
        SET
          HeaderJson = @headerJson,
          FooterJson = @footerJson,
          HeroJson = @heroJson,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id AS id,
          INSERTED.HeaderJson AS headerJson,
          INSERTED.FooterJson AS footerJson,
          INSERTED.HeroJson AS heroJson
        WHERE Id = @id;
      `);

    return res.json({
      ok: true,
      message: 'Đã lưu cấu hình giao diện website.',
      data: mapSiteSettings(result.recordset[0])
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa lưu được cấu hình giao diện website.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

router.post(
  '/posts',
  verifyAdminToken,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    const title = normalizeText(req.body.title);
    const content = normalizeText(req.body.content);

    if (!title || !content) {
      deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
      deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

      return res.status(400).json({
        ok: false,
        message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.'
      });
    }

    const slug = createSlug(title);

    if (!slug) {
      deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
      deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

      return res.status(400).json({
        ok: false,
        message: 'Tiêu đề bài viết chưa hợp lệ.'
      });
    }

    let pool;

    try {
      pool = await getConnectionPool();
      await ensureAdminCmsTables(pool);

      const duplicatePost = await pool.request()
        .input('slug', sql.NVarChar(220), slug)
        .query(`
          SELECT TOP 1 Id
          FROM dbo.Posts
          WHERE Slug = @slug;
        `);

      if (duplicatePost.recordset.length > 0) {
        deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
        deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

        return res.status(400).json({
          ok: false,
          message: 'Tiêu đề này đã tạo ra đường dẫn trùng. Hãy đổi tiêu đề khác.'
        });
      }

      const imagePath = buildStoredMediaPath(req.files?.image?.[0]);
      const videoPath = buildStoredMediaPath(req.files?.video?.[0]);

      const result = await pool.request()
        .input('title', sql.NVarChar(200), title)
        .input('slug', sql.NVarChar(220), slug)
        .input('content', sql.NVarChar(sql.MAX), content)
        .input('imagePath', sql.NVarChar(500), imagePath)
        .input('videoPath', sql.NVarChar(500), videoPath)
        .query(`
          INSERT INTO dbo.Posts (Title, Slug, Content, ImagePath, VideoPath)
          OUTPUT
            INSERTED.Id AS id,
            INSERTED.Title AS title,
            INSERTED.Slug AS slug,
            INSERTED.Content AS content,
            INSERTED.ImagePath AS imagePath,
            INSERTED.VideoPath AS videoPath,
            INSERTED.CreatedAt AS createdAt,
            INSERTED.UpdatedAt AS updatedAt
          VALUES (@title, @slug, @content, @imagePath, @videoPath);
        `);

      return res.status(201).json({
        ok: true,
        message: 'Đã tạo bài viết mới.',
        data: result.recordset[0]
      });
    } catch (error) {
      deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
      deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

      return res.status(500).json({
        ok: false,
        message: 'Chưa tạo được bài viết mới.',
        error: error.message
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  }
);

router.put(
  '/posts/:id',
  verifyAdminToken,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    const postId = Number(req.params.id);
    const title = normalizeText(req.body.title);
    const content = normalizeText(req.body.content);

    if (!postId || !title || !content) {
      deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
      deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

      return res.status(400).json({
        ok: false,
        message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.'
      });
    }

    const slug = createSlug(title);

    let pool;

    try {
      pool = await getConnectionPool();
      await ensureAdminCmsTables(pool);

      const currentPost = await pool.request()
        .input('id', sql.Int, postId)
        .query(`
          SELECT TOP 1
            Id AS id,
            ImagePath AS imagePath,
            VideoPath AS videoPath
          FROM dbo.Posts
          WHERE Id = @id;
        `);

      if (currentPost.recordset.length === 0) {
        deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
        deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

        return res.status(404).json({
          ok: false,
          message: 'Không tìm thấy bài viết cần cập nhật.'
        });
      }

      const duplicatePost = await pool.request()
        .input('slug', sql.NVarChar(220), slug)
        .input('id', sql.Int, postId)
        .query(`
          SELECT TOP 1 Id
          FROM dbo.Posts
          WHERE Slug = @slug AND Id <> @id;
        `);

      if (duplicatePost.recordset.length > 0) {
        deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
        deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

        return res.status(400).json({
          ok: false,
          message: 'Tiêu đề này đã tạo ra đường dẫn trùng. Hãy đổi tiêu đề khác.'
        });
      }

      const nextImagePath = req.files?.image?.[0]
        ? buildStoredMediaPath(req.files.image[0])
        : currentPost.recordset[0].imagePath;
      const nextVideoPath = req.files?.video?.[0]
        ? buildStoredMediaPath(req.files.video[0])
        : currentPost.recordset[0].videoPath;

      const result = await pool.request()
        .input('id', sql.Int, postId)
        .input('title', sql.NVarChar(200), title)
        .input('slug', sql.NVarChar(220), slug)
        .input('content', sql.NVarChar(sql.MAX), content)
        .input('imagePath', sql.NVarChar(500), nextImagePath)
        .input('videoPath', sql.NVarChar(500), nextVideoPath)
        .query(`
          UPDATE dbo.Posts
          SET
            Title = @title,
            Slug = @slug,
            Content = @content,
            ImagePath = @imagePath,
            VideoPath = @videoPath,
            UpdatedAt = SYSUTCDATETIME()
          OUTPUT
            INSERTED.Id AS id,
            INSERTED.Title AS title,
            INSERTED.Slug AS slug,
            INSERTED.Content AS content,
            INSERTED.ImagePath AS imagePath,
            INSERTED.VideoPath AS videoPath,
            INSERTED.CreatedAt AS createdAt,
            INSERTED.UpdatedAt AS updatedAt
          WHERE Id = @id;
        `);

      if (req.files?.image?.[0]) {
        deleteUploadedFile(currentPost.recordset[0].imagePath);
      }

      if (req.files?.video?.[0]) {
        deleteUploadedFile(currentPost.recordset[0].videoPath);
      }

      return res.json({
        ok: true,
        message: 'Đã cập nhật bài viết.',
        data: result.recordset[0]
      });
    } catch (error) {
      deleteUploadedFile(buildStoredMediaPath(req.files?.image?.[0]));
      deleteUploadedFile(buildStoredMediaPath(req.files?.video?.[0]));

      return res.status(500).json({
        ok: false,
        message: 'Chưa cập nhật được bài viết.',
        error: error.message
      });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  }
);

router.delete('/posts/:id', verifyAdminToken, async (req, res) => {
  const postId = Number(req.params.id);

  if (!postId) {
    return res.status(400).json({
      ok: false,
      message: 'Mã bài viết chưa hợp lệ.'
    });
  }

  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const currentPost = await pool.request()
      .input('id', sql.Int, postId)
      .query(`
        SELECT TOP 1
          Id AS id,
          ImagePath AS imagePath,
          VideoPath AS videoPath
        FROM dbo.Posts
        WHERE Id = @id;
      `);

    if (currentPost.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Không tìm thấy bài viết để xóa.'
      });
    }

    await pool.request()
      .input('id', sql.Int, postId)
      .query(`
        DELETE FROM dbo.Posts
        WHERE Id = @id;
      `);

    deleteUploadedFile(currentPost.recordset[0].imagePath);
    deleteUploadedFile(currentPost.recordset[0].videoPath);

    return res.json({
      ok: true,
      message: 'Đã xóa bài viết.'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa xóa được bài viết.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

router.post('/change-credentials', verifyAdminToken, async (req, res) => {
  const currentUsername = normalizeText(req.body.currentUsername);
  const currentPassword = normalizeText(req.body.currentPassword);
  const newUsername = normalizeText(req.body.newUsername);
  const newPassword = normalizeText(req.body.newPassword);

  if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: 'Vui lòng nhập đầy đủ thông tin để đổi tài khoản quản trị.'
    });
  }

  let pool;

  try {
    pool = await getConnectionPool();
    await ensureAdminCmsTables(pool);

    const adminUser = await findAdminUserByUsername(pool, currentUsername);

    if (!adminUser) {
      return res.status(400).json({
        ok: false,
        message: 'Tên đăng nhập hiện tại chưa đúng.'
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, adminUser.passwordHash);

    if (!passwordMatches) {
      return res.status(400).json({
        ok: false,
        message: 'Mật khẩu hiện tại chưa đúng.'
      });
    }

    const duplicateUser = await pool.request()
      .input('username', sql.NVarChar(100), newUsername)
      .input('id', sql.Int, adminUser.id)
      .query(`
        SELECT TOP 1 Id
        FROM dbo.AdminUsers
        WHERE Username = @username AND Id <> @id;
      `);

    if (duplicateUser.recordset.length > 0) {
      return res.status(400).json({
        ok: false,
        message: 'Tên đăng nhập mới đã tồn tại.'
      });
    }

    const nextPasswordHash = await bcrypt.hash(newPassword, 10);

    const result = await pool.request()
      .input('id', sql.Int, adminUser.id)
      .input('username', sql.NVarChar(100), newUsername)
      .input('passwordHash', sql.NVarChar(255), nextPasswordHash)
      .query(`
        UPDATE dbo.AdminUsers
        SET
          Username = @username,
          PasswordHash = @passwordHash,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Username AS username
        WHERE Id = @id;
      `);

    return res.json({
      ok: true,
      message: 'Đã đổi tài khoản quản trị.',
      data: {
        token: createAdminToken(result.recordset[0]),
        user: result.recordset[0]
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Chưa đổi được tài khoản quản trị.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

module.exports = router;
