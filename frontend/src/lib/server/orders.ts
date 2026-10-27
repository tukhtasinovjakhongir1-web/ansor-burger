import 'server-only';
import { randomInt } from 'node:crypto';
import { one, q } from './db';
import { getSettings } from './menu';
import { isOpenAt } from '../time';
import { digits, formatPrice, formatPhoneInput, isValidPhone } from '../utils';
import type { CheckoutInput, Order, OrderItem, Product, Zone } from '../types';
import type { TgUser } from './tg-auth';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode(len = 8) {
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

const ORDER_SELECT = `
  SELECT o.*, o.telegram_id::text AS telegram_id, u.username,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id', i.id, 'product_id', i.product_id, 'name', i.name, 'price', i.price,
        'qty', i.qty, 'total', i.total, 'image', p.image) ORDER BY i.id)
      FROM order_items i LEFT JOIN products p ON p.id = i.product_id
      WHERE i.order_id = o.id
    ), '[]'::json) AS items
  FROM orders o LEFT JOIN users u ON u.id = o.user_id`;

export async function getOrderById(id: number) {
  return one<Order>(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
}

export async function getOrderByCode(code: string) {
  return one<Order>(`${ORDER_SELECT} WHERE o.code = $1`, [code.toUpperCase()]);
}

export async function listCustomerOrders(tgId: number | null, codes: string[]) {
  const clean = codes.map((c) => c.toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean).slice(0, 50);
  if (!tgId && clean.length === 0) return [];
  return q<Order>(
    `${ORDER_SELECT} WHERE ($1::bigint IS NOT NULL AND o.telegram_id = $1::bigint) OR o.code = ANY($2::text[])
     ORDER BY o.created_at DESC LIMIT 30`,
    [tgId, clean]
  );
}

export async function upsertTgUser(user: TgUser, phone?: string) {
  const row = await one<{ id: number }>(
    `INSERT INTO users (telegram_id, first_name, last_name, username, phone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (telegram_id) DO UPDATE SET
       first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, username = EXCLUDED.username,
       phone = COALESCE(EXCLUDED.phone, users.phone), last_seen_at = now()
     RETURNING id`,
    [user.id, user.first_name || null, user.last_name || null, user.username || null, phone || null]
  );
  return row?.id ?? null;
}

type Result = { ok: true; order: Order } | { ok: false; error: string };

export async function createOrder(input: CheckoutInput, tgUser: TgUser | null): Promise<Result> {
  const settings = await getSettings();
  if (!settings.accepting_orders) return { ok: false, error: 'Hozircha buyurtma qabul qilinmayapti' };

  const type = input.order_type;
  const enabled = { delivery: settings.delivery_enabled, pickup: settings.pickup_enabled, dinein: settings.dinein_enabled };
  if (!(type in enabled) || !enabled[type]) return { ok: false, error: "Bu buyurtma turi hozir mavjud emas" };

  const name = String(input.customer_name || '').trim().slice(0, 60);
  if (name.length < 2) return { ok: false, error: 'Ismingizni kiriting' };
  if (!isValidPhone(input.phone || '')) return { ok: false, error: "Telefon raqami noto'g'ri" };
  const phone = formatPhoneInput(digits(input.phone));

  // Mahsulotlar — narxlar faqat bazadan olinadi
  const wanted = new Map<number, number>();
  for (const it of input.items || []) {
    const id = Number(it.product_id);
    const qty = Math.floor(Number(it.qty));
    if (!id || qty < 1) continue;
    wanted.set(id, Math.min(50, (wanted.get(id) || 0) + qty));
  }
  if (wanted.size === 0) return { ok: false, error: "Savat bo'sh" };

  const products = await q<Product>('SELECT * FROM products WHERE id = ANY($1::int[])', [[...wanted.keys()]]);
  const items: Omit<OrderItem, 'id'>[] = [];
  for (const [id, qty] of wanted) {
    const p = products.find((x) => x.id === id);
    if (!p || !p.is_active) return { ok: false, error: 'Savatdagi mahsulot menyudan olib tashlangan' };
    if (!p.is_available) return { ok: false, error: `"${p.name}" hozir mavjud emas` };
    items.push({ product_id: p.id, name: p.name, price: p.price, qty, total: p.price * qty });
  }
  const subtotal = items.reduce((s, it) => s + it.total, 0);

  // Vaqt: darhol yoki oldindan buyurtma
  const now = new Date();
  let scheduledAt: Date | null = null;
  if (input.scheduled_at) {
    scheduledAt = new Date(input.scheduled_at);
    if (Number.isNaN(scheduledAt.getTime())) return { ok: false, error: "Vaqt noto'g'ri" };
    const minTime = now.getTime() + (settings.prep_minutes - 5) * 60_000;
    if (scheduledAt.getTime() < minTime) return { ok: false, error: 'Tanlangan vaqt juda yaqin, boshqasini tanlang' };
    if (scheduledAt.getTime() > now.getTime() + 2 * 86_400_000 + 3_600_000)
      return { ok: false, error: 'Faqat 2 kun oldinga buyurtma berish mumkin' };
    if (!isOpenAt(scheduledAt, settings)) return { ok: false, error: 'Tanlangan vaqtda biz yopiqmiz' };
  } else if (!isOpenAt(now, settings)) {
    return {
      ok: false,
      error: `Hozir yopiqmiz (${settings.open_time}–${settings.close_time}). Oldindan buyurtma uchun vaqt tanlang`,
    };
  }

  // Yetkazib berish
  let zone: Zone | null = null;
  let fee = 0;
  const address = String(input.address || '').trim().slice(0, 300);
  const landmark = String(input.landmark || '').trim().slice(0, 200);
  if (type === 'delivery') {
    zone = await one<Zone>('SELECT * FROM zones WHERE id = $1 AND is_active', [Number(input.zone_id)]);
    if (!zone) return { ok: false, error: 'Yetkazib berish hududini tanlang' };
    if (address.length < 3) return { ok: false, error: 'Manzilni kiriting' };
    if (subtotal < zone.min_order)
      return { ok: false, error: `Bu hudud uchun minimal buyurtma: ${formatPrice(zone.min_order)}` };
    fee = settings.free_delivery_from > 0 && subtotal >= settings.free_delivery_from ? 0 : zone.fee;
  }
  const total = subtotal + fee;

  // To'lov
  const pm = input.payment_method;
  if (pm === 'cash' && !settings.cash_enabled) return { ok: false, error: "Naqd to'lov hozir mavjud emas" };
  if (pm === 'card' && !settings.card_enabled) return { ok: false, error: "Karta orqali to'lov hozir mavjud emas" };
  if (pm !== 'cash' && pm !== 'card') return { ok: false, error: "To'lov turini tanlang" };
  let changeFrom: number | null = null;
  if (pm === 'cash' && input.change_from) {
    changeFrom = Math.floor(Number(input.change_from));
    if (!(changeFrom > total)) changeFrom = null;
  }

  const guests = type === 'dinein' ? Math.min(30, Math.max(1, Math.floor(Number(input.guests) || 2))) : null;
  const lat = type === 'delivery' && Number.isFinite(Number(input.lat)) && input.lat ? Number(input.lat) : null;
  const lng = type === 'delivery' && Number.isFinite(Number(input.lng)) && input.lng ? Number(input.lng) : null;

  const userId = tgUser ? await upsertTgUser(tgUser, phone) : null;

  // Bitta SQL bilan buyurtma va tarkibini yozamiz (atomar)
  const base = [
    makeCode(),
    userId,
    tgUser?.id ?? null,
    name,
    phone,
    type,
    zone?.id ?? null,
    zone?.name ?? null,
    type === 'delivery' ? address : null,
    type === 'delivery' ? landmark || null : null,
    lat,
    lng,
    scheduledAt ? scheduledAt.toISOString() : null,
    guests,
    pm,
    changeFrom,
    subtotal,
    fee,
    total,
    String(input.comment || '').trim().slice(0, 500) || null,
  ];
  const values: string[] = [];
  const params: unknown[] = [...base];
  for (const it of items) {
    const n = params.length;
    values.push(`($${n + 1}::int, $${n + 2}::text, $${n + 3}::int, $${n + 4}::int, $${n + 5}::int)`);
    params.push(it.product_id, it.name, it.price, it.qty, it.total);
  }

  const row = await one<{ order_id: number }>(
    `WITH o AS (
       INSERT INTO orders (code, user_id, telegram_id, customer_name, phone, order_type, zone_id, zone_name,
         address, landmark, lat, lng, scheduled_at, guests, payment_method, change_from,
         subtotal, delivery_fee, total, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING id
     )
     INSERT INTO order_items (order_id, product_id, name, price, qty, total)
     SELECT o.id, v.product_id, v.name, v.price, v.qty, v.total
     FROM o, (VALUES ${values.join(', ')}) AS v(product_id, name, price, qty, total)
     RETURNING order_id`,
    params
  );
  if (!row) return { ok: false, error: "Buyurtmani saqlab bo'lmadi" };

  const order = await getOrderById(row.order_id);
  if (!order) return { ok: false, error: "Buyurtmani saqlab bo'lmadi" };
  return { ok: true, order };
}
