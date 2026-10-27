import { after } from 'next/server';
import { createOrder, listCustomerOrders } from '@/lib/server/orders';
import { notifyAdminsNewOrder, notifyCustomerCreated } from '@/lib/server/telegram';
import { tgUserFromRequest } from '@/lib/server/tg-auth';
import type { CheckoutInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Mijozning buyurtmalari: Telegram foydalanuvchisi bo'yicha yoki saqlangan kodlar bo'yicha */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const codes = (url.searchParams.get('codes') || '').split(',');
  const tgUser = tgUserFromRequest(req);
  const orders = await listCustomerOrders(tgUser?.id ?? null, codes);
  return Response.json({ orders });
}

export async function POST(req: Request) {
  let input: CheckoutInput;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "So'rov noto'g'ri" }, { status: 400 });
  }

  const tgUser = tgUserFromRequest(req);
  try {
    const result = await createOrder(input, tgUser);
    if (!result.ok) return Response.json({ error: result.error }, { status: 422 });

    const order = result.order;
    // Xabarnomalar javobdan keyin yuboriladi — mijoz kutib qolmaydi
    after(async () => {
      await Promise.allSettled([notifyAdminsNewOrder(order), notifyCustomerCreated(order)]);
    });
    return Response.json({ order });
  } catch (err) {
    console.error('Buyurtma xatosi:', err);
    return Response.json({ error: "Serverda xatolik. Qaytadan urinib ko'ring" }, { status: 500 });
  }
}
