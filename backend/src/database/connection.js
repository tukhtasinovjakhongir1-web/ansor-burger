const { neon } = require('@neondatabase/serverless');
const config = require('../config/default');

// Neon HTTP drayveri: serverless (Vercel) va oddiy Node uchun bir xil ishlaydi
const sql = neon(config.databaseUrl);

/** Parametrli so'rov: query('SELECT * FROM users WHERE id = $1', [id]) */
async function query(text, params = []) {
  return sql.query(text, params);
}

async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = { sql, query, one };
