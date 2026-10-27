import { getOrderByCode } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) return Response.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
  return Response.json({ order });
}
