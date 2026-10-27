import { q } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const TZ = `'Asia/Tashkent'`;
const DAY = (col: string) => `(${col} AT TIME ZONE ${TZ})::date`;
const TODAY = `(now() AT TIME ZONE ${TZ})::date`;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [today, series, top, byType, customers] = await Promise.all([
    q(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS orders,
         COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)::int AS revenue,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
         COALESCE(AVG(total) FILTER (WHERE status <> 'cancelled'), 0)::int AS avg_check,
         (SELECT COUNT(*) FROM orders WHERE status = 'new')::int AS pending,
         (SELECT COUNT(*) FROM orders WHERE status IN ('accepted','cooking','ready','delivering'))::int AS active,
         (SELECT COUNT(*) FROM orders WHERE scheduled_at > now() AND status NOT IN ('done','cancelled'))::int AS preorders
       FROM orders WHERE ${DAY('created_at')} = ${TODAY}`
    ),
    q(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
         COALESCE(COUNT(o.id), 0)::int AS orders,
         COALESCE(SUM(o.total), 0)::int AS revenue
       FROM generate_series(${TODAY} - 6, ${TODAY}, '1 day') d
       LEFT JOIN orders o ON ${DAY('o.created_at')} = d::date AND o.status <> 'cancelled'
       GROUP BY d ORDER BY d`
    ),
    q(
      `SELECT i.name, SUM(i.qty)::int AS qty, SUM(i.total)::int AS revenue
       FROM order_items i JOIN orders o ON o.id = i.order_id
       WHERE o.status <> 'cancelled' AND o.created_at > now() - interval '7 days'
       GROUP BY i.name ORDER BY qty DESC LIMIT 6`
    ),
    q(
      `SELECT order_type, COUNT(*)::int AS count FROM orders
       WHERE ${DAY('created_at')} = ${TODAY} AND status <> 'cancelled' GROUP BY order_type`
    ),
    q(`SELECT COUNT(DISTINCT phone)::int AS total FROM orders`),
  ]);

  return Response.json({
    today: today[0],
    series,
    top,
    byType,
    customers: customers[0]?.total ?? 0,
  });
}
