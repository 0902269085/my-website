const sql = require('mssql');

const { env } = require('./env');

async function getConnectionPool() {
  const pool = new sql.ConnectionPool(env.db);
  await pool.connect();
  return pool;
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
  getConnectionPool,
  sql
};
