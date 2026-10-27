import { q } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const search = (new URL(req.url).searchParams.get('q') || '').trim();
  const params: unknown[] = [];
  let where = 'TRUE';
  if (search) {
    params.push(`%${search}%`, search.replace(/\D/g, '') || '-');
    where = `(c.name ILIKE $1 OR regexp_replace(c.phone, '\\D', '', 'g') LIKE '%' || $2 || '%' OR c.username ILIKE $1)`;
  }
  const customers = await q(
    `WITH c AS (
       SELECT o.phone,
         (ARRAY_AGG(o.customer_name ORDER BY o.created_at DESC))[1] AS name,
         (ARRAY_AGG(u.username ORDER BY o.created_at DESC) FILTER (WHERE u.username IS NOT NULL))[1] AS username,
         MAX(o.telegram_id)::text AS telegram_id,
         COUNT(*) FILTER (WHERE o.status <> 'cancelled')::int AS orders,
         COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'), 0)::int AS spent,
         MAX(o.created_at) AS last_order_at,
         MIN(o.created_at) AS first_order_at
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       GROUP BY o.phone
     )
     SELECT * FROM c WHERE ${where} ORDER BY last_order_at DESC LIMIT 500`,
    params
  );
  const [bot] = await q<{ count: number }>('SELECT COUNT(*)::int AS count FROM users');
  return Response.json({ customers, botUsers: bot?.count ?? 0 });
}
