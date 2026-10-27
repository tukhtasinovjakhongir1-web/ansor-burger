import { q } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/** Telegram'da buyurtma xabarlarini oladigan adminlar (botda /admin orqali qo'shiladi) */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const admins = await q(
    `SELECT a.telegram_id::text AS telegram_id, a.name, a.created_at, u.username
     FROM admins a LEFT JOIN users u ON u.telegram_id = a.telegram_id ORDER BY a.created_at`
  );
  return Response.json({ admins, bot: process.env.NEXT_PUBLIC_BOT_USERNAME || null });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return Response.json({ error: "ID noto'g'ri" }, { status: 422 });
  await q('DELETE FROM admins WHERE telegram_id = $1::bigint', [id]);
  return Response.json({ ok: true });
}
