import { q } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TZ = `'Asia/Tashkent'`;
const RANGES: Record<string, string> = {
  today: `(o.created_at AT TIME ZONE ${TZ})::date = (now() AT TIME ZONE ${TZ})::date`,
  yesterday: `(o.created_at AT TIME ZONE ${TZ})::date = (now() AT TIME ZONE ${TZ})::date - 1`,
  week: `o.created_at > now() - interval '7 days'`,
  month: `o.created_at > now() - interval '30 days'`,
  all: 'TRUE',
};

const GROUPS: Record<string, string> = {
  new: `o.status = 'new'`,
  active: `o.status IN ('accepted','cooking','ready','delivering')`,
  preorder: `o.scheduled_at IS NOT NULL AND o.status NOT IN ('done','cancelled')`,
  done: `o.status = 'done'`,
  cancelled: `o.status = 'cancelled'`,
  all: 'TRUE',
};

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);

  // Yengil so'rov: yangi buyurtmalarni kuzatish uchun
  if (url.searchParams.get('poll')) {
    const [row] = await q<{ latest_id: number; pending: number }>(
      `SELECT COALESCE(MAX(id), 0)::int AS latest_id,
              COUNT(*) FILTER (WHERE status = 'new')::int AS pending FROM orders`
    );
    return Response.json(row);
  }

  const groupKey = url.searchParams.get('status') || 'all';
  const group = GROUPS[groupKey] || GROUPS.all;
  // Oldindan buyurtmalar qachon berilganidan qat'i nazar ko'rsatiladi
  const rangeSql = RANGES[url.searchParams.get('range') || 'today'] || RANGES.today;
  const range = groupKey === 'preorder' ? 'TRUE' : rangeSql;
  const search = (url.searchParams.get('q') || '').trim();

  const params: unknown[] = [];
  let searchSql = 'TRUE';
  if (search) {
    params.push(`%${search}%`, search.replace(/\D/g, '') || '-', Number(search.replace(/\D/g, '')) || 0);
    searchSql = `(o.customer_name ILIKE $1 OR regexp_replace(o.phone, '\\D', '', 'g') LIKE '%' || $2 || '%' OR o.id = $3 OR o.address ILIKE $1)`;
  }

  // Bugungi/tanlangan davr uchun guruhlar soni (tablar uchun)
  const countsPromise = q<{ key: string; count: number }>(
    `SELECT key, COUNT(o.id)::int AS count FROM (VALUES ${Object.keys(GROUPS)
      .map((k) => `('${k}')`)
      .join(',')}) g(key)
     LEFT JOIN orders o ON (g.key = 'preorder' OR ${rangeSql}) AND ${searchSql} AND CASE g.key ${Object.entries(GROUPS)
       .map(([k, cond]) => `WHEN '${k}' THEN ${cond}`)
       .join(' ')} END
     GROUP BY key`,
    params
  );

  const ordersPromise = q<Order>(
    `SELECT o.*, o.telegram_id::text AS telegram_id, u.username,
       COALESCE((SELECT json_agg(json_build_object('id', i.id, 'product_id', i.product_id, 'name', i.name,
         'price', i.price, 'qty', i.qty, 'total', i.total) ORDER BY i.id) FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE ${range} AND ${group} AND ${searchSql}
     ORDER BY ${groupKey === 'preorder' ? 'o.scheduled_at ASC' : `CASE WHEN o.status = 'new' THEN 0 ELSE 1 END, o.created_at DESC`}
     LIMIT 300`,
    params
  );

  const [counts, orders] = await Promise.all([countsPromise, ordersPromise]);
  return Response.json({ orders, counts: Object.fromEntries(counts.map((c) => [c.key, c.count])) });
}
