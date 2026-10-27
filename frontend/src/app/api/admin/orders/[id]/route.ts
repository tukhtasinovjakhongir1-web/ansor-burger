import { after } from 'next/server';
import { one } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';
import { getOrderById } from '@/lib/server/orders';
import { notifyCustomerPaid, notifyCustomerStatus } from '@/lib/server/telegram';
import { STATUS_LABEL } from '@/lib/constants';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) return Response.json({ error: 'Topilmadi' }, { status: 404 });
  return Response.json({ order });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const before = await getOrderById(Number(id));
  if (!before) return Response.json({ error: 'Topilmadi' }, { status: 404 });

  const status = body.status as OrderStatus | undefined;
  if (status && !(status in STATUS_LABEL)) return Response.json({ error: "Holat noto'g'ri" }, { status: 422 });
  const paymentStatus = body.payment_status === 'paid' || body.payment_status === 'unpaid' ? body.payment_status : undefined;

  await one(
    `UPDATE orders SET
       status = COALESCE($1, status),
       payment_status = COALESCE($2, payment_status),
       cancel_reason = CASE WHEN $1 = 'cancelled' THEN $3 ELSE cancel_reason END,
       updated_at = now()
     WHERE id = $4`,
    [status ?? null, paymentStatus ?? null, body.cancel_reason ? String(body.cancel_reason).slice(0, 300) : null, Number(id)]
  );
  const order = await getOrderById(Number(id));
  if (!order) return Response.json({ error: 'Topilmadi' }, { status: 404 });

  after(async () => {
    if (status && status !== before.status) await notifyCustomerStatus(order);
    if (paymentStatus === 'paid' && before.payment_status !== 'paid') await notifyCustomerPaid(order);
  });
  return Response.json({ order });
}
