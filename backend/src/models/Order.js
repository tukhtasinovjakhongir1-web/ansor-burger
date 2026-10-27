const { query, one } = require('../database/connection');

const SELECT = `
  SELECT o.*, o.telegram_id::text AS telegram_id, u.username,
    COALESCE((SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'price', i.price,
      'qty', i.qty, 'total', i.total) ORDER BY i.id) FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items
  FROM orders o LEFT JOIN users u ON u.id = o.user_id`;

const TODAY = `(o.created_at AT TIME ZONE 'Asia/Tashkent')::date = (now() AT TIME ZONE 'Asia/Tashkent')::date`;

const Order = {
  async findById(id) {
    return one(`${SELECT} WHERE o.id = $1`, [id]);
  },

  async listByTelegramId(telegramId, limit = 5) {
    return query(`${SELECT} WHERE o.telegram_id = $1 ORDER BY o.created_at DESC LIMIT $2`, [telegramId, limit]);
  },

  async lastByTelegramId(telegramId) {
    return one(`${SELECT} WHERE o.telegram_id = $1 ORDER BY o.created_at DESC LIMIT 1`, [telegramId]);
  },

  async listActive(limit = 10) {
    return query(
      `${SELECT} WHERE o.status IN ('new','accepted','cooking','ready','delivering')
       ORDER BY o.created_at ASC LIMIT $1`,
      [limit]
    );
  },

  async updateStatus(id, status, cancelReason = null) {
    await query(
      `UPDATE orders SET status = $2,
         cancel_reason = CASE WHEN $2 = 'cancelled' THEN COALESCE($3, cancel_reason) ELSE cancel_reason END,
         updated_at = now()
       WHERE id = $1`,
      [id, status, cancelReason]
    );
    return Order.findById(id);
  },

  async markPaid(id) {
    await query(`UPDATE orders SET payment_status = 'paid', updated_at = now() WHERE id = $1`, [id]);
    return Order.findById(id);
  },

  async todayStats() {
    return one(
      `SELECT
         COUNT(*) FILTER (WHERE o.status <> 'cancelled')::int AS orders,
         COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'), 0)::int AS revenue,
         COUNT(*) FILTER (WHERE o.status = 'cancelled')::int AS cancelled,
         (SELECT COUNT(*) FROM orders WHERE status = 'new')::int AS pending,
         (SELECT COUNT(*) FROM orders WHERE status IN ('accepted','cooking','ready','delivering'))::int AS active
       FROM orders o WHERE ${TODAY}`
    );
  },
};

module.exports = Order;
