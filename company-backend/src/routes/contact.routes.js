const { Router } = require('express');
const { getConnectionPool, sql } = require('../config/database');

const router = Router();

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getMissingFields(contactData) {
  const missingFields = [];

  if (!contactData.fullName) {
    missingFields.push('Họ tên');
  }

  if (!contactData.email) {
    missingFields.push('Email');
  }

  if (!contactData.phone) {
    missingFields.push('Số điện thoại');
  }

  if (!contactData.message) {
    missingFields.push('Nội dung liên hệ');
  }

  return missingFields;
}

router.post('/', async (req, res) => {
  const contactData = {
    fullName: normalizeText(req.body.fullName),
    email: normalizeText(req.body.email),
    phone: normalizeText(req.body.phone),
    message: normalizeText(req.body.message)
  };

  const missingFields = getMissingFields(contactData);

  if (missingFields.length > 0) {
    return res.status(400).json({
      ok: false,
      message: `Vui lòng nhập đầy đủ thông tin: ${missingFields.join(', ')}.`
    });
  }

  let pool;

  try {
    pool = await getConnectionPool();

    const result = await pool.request()
      .input('fullName', sql.NVarChar(150), contactData.fullName)
      .input('email', sql.NVarChar(255), contactData.email)
      .input('phone', sql.NVarChar(30), contactData.phone)
      .input('message', sql.NVarChar(sql.MAX), contactData.message)
      .query(`
        INSERT INTO dbo.ContactMessages (FullName, Email, Phone, Message)
        OUTPUT
          INSERTED.Id AS id,
          INSERTED.FullName AS fullName,
          INSERTED.Email AS email,
          INSERTED.Phone AS phone,
          INSERTED.Message AS message,
          INSERTED.SubmittedAt AS submittedAt
        VALUES (@fullName, @email, @phone, @message);
      `);

    return res.status(201).json({
      ok: true,
      message: 'Hệ thống đã nhận và lưu thông tin liên hệ.',
      data: result.recordset[0]
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Hệ thống chưa lưu được thông tin liên hệ. Vui lòng thử lại.',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

module.exports = router;
