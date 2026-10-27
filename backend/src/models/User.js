const { query, one } = require('../database/connection');
const config = require('../config/default');

const User = {
  async upsertFromTelegram(from) {
    return one(
      `INSERT INTO users (telegram_id, first_name, last_name, username)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (telegram_id) DO UPDATE SET
         first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
         username = EXCLUDED.username, last_seen_at = now()
       RETURNING *`,
      [from.id, from.first_name || null, from.last_name || null, from.username || null]
    );
  },

  async findByTelegramId(telegramId) {
    return one('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  },

  async setPhone(telegramId, phone) {
    return one('UPDATE users SET phone = $2 WHERE telegram_id = $1 RETURNING *', [telegramId, phone]);
  },

  async count() {
    const row = await one('SELECT COUNT(*)::int AS count FROM users');
    return row ? row.count : 0;
  },

  /* ---- Adminlar ---- */

  async isAdmin(telegramId) {
    if (config.adminIds.includes(Number(telegramId))) return true;
    const row = await one('SELECT 1 FROM admins WHERE telegram_id = $1', [telegramId]);
    return Boolean(row);
  },

  async addAdmin(telegramId, name) {
    await query(
      `INSERT INTO admins (telegram_id, name) VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE SET name = EXCLUDED.name`,
      [telegramId, name]
    );
  },

  async removeAdmin(telegramId) {
    await query('DELETE FROM admins WHERE telegram_id = $1', [telegramId]);
  },

  async adminIds() {
    const rows = await query('SELECT telegram_id::text AS id FROM admins');
    return [...new Set([...rows.map((r) => r.id), ...config.adminIds.map(String)])];
  },
};

module.exports = User;
