import 'server-only';
import { q } from './db';
import { getSettings } from './menu';
import { ORDER_TYPE_LABEL, STATUS_EMOJI, STATUS_LABEL } from '../constants';
import { formatDateTime } from '../time';
import { formatPrice } from '../utils';
import type { Order, OrderStatus } from '../types';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function appUrl() {
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return '';
}

async function tg(method: string, body: Record<string, unknown>) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) console.warn(`[telegram] ${method}:`, json.description);
    return json;
  } catch (err) {
    console.warn(`[telegram] ${method} xato:`, err);
    return null;
  }
}

function sendMessage(chatId: number | string, text: string, extra: Record<string, unknown> = {}) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...extra,
  });
}

/** Uzun matnni qisqartiradi (emoji yarmida kesilmasligi uchun belgilar bo'yicha) */
function clip(value: unknown, max: number) {
  const chars = Array.from(String(value ?? ''));
  return max && chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('');
}

type TextOpts = { maxItems?: number; cut?: number };

/**
 * Admin/oshxona uchun buyurtma matni (bot ham xuddi shu formatda yozadi — backend/src/utils/format.js).
 * maxItems — nechta mahsulot ko'rsatilsin, cut — uzun maydonlarni qisqartirish (rasm izohi uchun).
 */
export function orderText(o: Order, { maxItems = Infinity, cut = 0 }: TextOpts = {}) {
  const t = (v: unknown) => esc(clip(v, cut));
  const when = o.scheduled_at ? `🗓 ${formatDateTime(o.scheduled_at)}` : '⚡ Imkon qadar tez';
  const lines = [
    `${STATUS_EMOJI[o.status]} <b>Buyurtma #${o.id}</b> — ${esc(STATUS_LABEL[o.status])}`,
    `${o.order_type === 'delivery' ? '🚚' : o.order_type === 'pickup' ? '🛍' : '🍽'} ${ORDER_TYPE_LABEL[o.order_type]} · ${when}`,
    '',
    `👤 ${esc(o.customer_name)}${o.username ? ` (@${esc(o.username)})` : ''}`,
    `📞 ${esc(o.phone)}`,
  ];
  if (o.order_type === 'delivery') {
    if (o.zone_name) lines.push(`📍 ${t(o.zone_name)}`);
    if (o.address) lines.push(`🏠 ${t(o.address)}`);
    if (o.landmark) lines.push(`🧭 Mo'ljal: ${t(o.landmark)}`);
    if (o.lat && o.lng) lines.push(`🗺 <a href="https://maps.google.com/?q=${o.lat},${o.lng}">Xaritada ko'rish</a>`);
  }
  if (o.order_type === 'dinein' && o.guests) lines.push(`👥 ${o.guests} kishi`);
  lines.push('', '<b>Tarkibi:</b>');
  const shown = o.items.slice(0, maxItems);
  for (const it of shown) {
    lines.push(`• ${esc(it.name)} × ${it.qty} = ${formatPrice(it.total)}`);
  }
  if (o.items.length > shown.length) lines.push(`… va yana ${o.items.length - shown.length} ta mahsulot`);
  lines.push('', `Mahsulotlar: ${formatPrice(o.subtotal)}`);
  if (o.order_type === 'delivery') {
    lines.push(`Yetkazish: ${o.delivery_fee ? formatPrice(o.delivery_fee) : 'bepul'}`);
  }
  lines.push(`<b>Jami: ${formatPrice(o.total)}</b>`);
  const pay =
    o.payment_method === 'card'
      ? `💳 Karta — ${o.payment_status === 'paid' ? "to'langan ✅" : "to'lov kutilmoqda"}`
      : `💵 Naqd${o.change_from ? ` (${formatPrice(o.change_from)} dan qaytim)` : ''}${o.payment_status === 'paid' ? " — to'langan ✅" : ''}`;
  lines.push(pay);
  if (o.comment) lines.push(`💬 ${t(o.comment)}`);
  if (o.status === 'cancelled' && o.cancel_reason) lines.push(`❗️ Sabab: ${t(o.cancel_reason)}`);
  return lines.join('\n');
}

// Telegram rasm izohi 1024 belgigacha (teglarsiz). Emoji 2 belgi sanaladi — biroz zaxira qoldiramiz.
const CAPTION_LIMIT = 1000;

const visibleLength = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').length;

/**
 * Rasm ostidagi buyurtma matni: 1024 belgiga sig'masa avval uzun maydonlar,
 * keyin mahsulotlar ro'yxati qisqartiriladi. Botdagi orderCaption bilan bir xil.
 */
export function orderCaption(o: Order, header = '') {
  const attempts: TextOpts[] = [{}, { cut: 150 }];
  for (let k = o.items.length - 1; k >= 0; k--) attempts.push({ cut: 150, maxItems: k });
  attempts.push({ cut: 60, maxItems: 0 });
  let text = '';
  for (const opts of attempts) {
    text = header + orderText(o, opts);
    if (visibleLength(text) <= CAPTION_LIMIT) return text;
  }
  return text;
}

type Btn = { text: string; callback_data?: string; url?: string };

export function adminKeyboard(o: Order) {
  const rows: Btn[][] = [];
  const st = o.status;
  const cb = (s: OrderStatus) => `os:${o.id}:${s}`;
  if (st === 'new') rows.push([{ text: '✅ Tasdiqlash', callback_data: cb('accepted') }]);
  if (st === 'accepted') rows.push([{ text: '👨‍🍳 Tayyorlanmoqda', callback_data: cb('cooking') }]);
  if (st === 'cooking') {
    rows.push([
      o.order_type === 'delivery'
        ? { text: "🚚 Yo'lga chiqdi", callback_data: cb('delivering') }
        : { text: '🛍 Tayyor', callback_data: cb('ready') },
    ]);
  }
  if (st === 'delivering' || st === 'ready') rows.push([{ text: '🎉 Yakunlandi', callback_data: cb('done') }]);
  if (o.payment_status !== 'paid' && st !== 'cancelled') {
    rows.push([{ text: "💰 To'landi deb belgilash", callback_data: `op:${o.id}` }]);
  }
  if (st !== 'done' && st !== 'cancelled') rows.push([{ text: '❌ Bekor qilish', callback_data: cb('cancelled') }]);
  const url = appUrl();
  if (url.startsWith('https://')) rows.push([{ text: '🖥 Admin panel', url: `${url}/admin/orders?id=${o.id}` }]);
  return { inline_keyboard: rows };
}

/** Xabar oladigan chatlar: ADMIN_CHAT_IDS (yoki ADMIN_IDS) + botda /admin qilganlar (admins jadvali) */
async function adminChatIds(): Promise<string[]> {
  const fromEnv = `${process.env.ADMIN_CHAT_IDS || ''},${process.env.ADMIN_IDS || ''}`
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^-?\d+$/.test(s));
  const rows = await q<{ telegram_id: string }>('SELECT telegram_id::text AS telegram_id FROM admins').catch(() => []);
  return [...new Set([...fromEnv, ...rows.map((r) => String(r.telegram_id))])];
}

function sendPhoto(chatId: number | string, photo: string, caption: string, extra: Record<string, unknown> = {}) {
  return tg('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', ...extra });
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = appUrl();
  if (!base.startsWith('https://') || !/^\/?[\w./-]+$/.test(path)) return null;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Buyurtma rasmi: eng qimmat mahsulotning rasmi, bo'lmasa umumiy banner */
function orderPhotoCandidates(o: Order) {
  const main = [...o.items].filter((i) => i.image).sort((a, b) => b.total - a.total)[0]?.image;
  const paths: string[] = [];
  if (main) {
    // Menyu rasmlarining kichik webp nusxasi bor — Telegram uchun to'liq JPG ni beramiz
    if (/_thumb\.webp$/.test(main)) paths.push(main.replace(/_thumb\.webp$/, '.jpg'));
    paths.push(main);
  }
  paths.push('/og/og-shop.jpg');
  return [...new Set(paths.map(absoluteUrl).filter((u): u is string => Boolean(u)))];
}

// Chat topilmadi yoki bot bloklangan — boshqa rasm bilan qayta urinish foyda bermaydi
type TgResult = { ok?: boolean; error_code?: number; description?: string; result?: { photo?: { file_id: string }[] } };
const chatUnreachable = (r: TgResult | null) =>
  r?.error_code === 403 || /chat not found|user not found|deactivated/i.test(r?.description || '');

/**
 * Yangi buyurtma: adminlarga taom rasmi, ostida buyurtma ma'lumotlari va "✅ Tasdiqlash" tugmasi.
 * Rasm yuborilmasa (manzil ochilmasa va h.k.) oddiy matnli xabar yuboriladi.
 */
export async function notifyAdminsNewOrder(o: Order) {
  const ids = await adminChatIds();
  if (!ids.length) {
    console.warn("[telegram] Yangi buyurtma: adminlar yo'q (ADMIN_CHAT_IDS yoki botda /admin PAROL)");
    return;
  }
  const header = '🔔 <b>YANGI BUYURTMA!</b>\n\n';
  const reply_markup = adminKeyboard(o);
  const caption = orderCaption(o, header);
  let photos = orderPhotoCandidates(o);

  const notify = async (chatId: string) => {
    for (const photo of photos) {
      const r: TgResult | null = await sendPhoto(chatId, photo, caption, { reply_markup });
      if (r?.ok) {
        // Keyingi adminlarga Telegram'dagi file_id bilan — rasm qayta yuklanmaydi
        const sizes = r.result?.photo;
        if (sizes?.length) photos = [sizes[sizes.length - 1].file_id];
        return;
      }
      if (chatUnreachable(r)) return;
    }
    photos = []; // rasm umuman ketmadi — keyingi chatlarga darhol matn
    await sendMessage(chatId, header + orderText(o), { reply_markup });
  };

  // Birinchi chat — rasmning file_id sini olish uchun, qolganlari parallel
  await notify(ids[0]);
  await Promise.all(ids.slice(1).map(notify));
}

function customerButton(o: Order) {
  const url = appUrl();
  return url.startsWith('https://')
    ? { reply_markup: { inline_keyboard: [[{ text: '📦 Buyurtmani kuzatish', web_app: { url: `${url}/orders/${o.code}` } }]] } }
    : {};
}

export async function notifyCustomerCreated(o: Order) {
  if (!o.telegram_id) return;
  const s = await getSettings();
  const when = o.scheduled_at ? `\n🗓 Vaqt: <b>${formatDateTime(o.scheduled_at)}</b>` : '';
  let text =
    `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n` +
    `Raqam: <b>#${o.id}</b>\nTuri: ${ORDER_TYPE_LABEL[o.order_type]}${when}\n` +
    `Jami: <b>${formatPrice(o.total)}</b>\n\n` +
    `Operator tez orada tasdiqlaydi. Holat o'zgarsa shu yerga xabar beramiz.`;
  if (o.payment_method === 'card') {
    text +=
      `\n\n💳 <b>Karta orqali to'lov</b>\n<code>${esc(s.card_number)}</code>\n${esc(s.card_holder)}\n` +
      `To'lovdan so'ng chek rasmini shu chatga yuboring.`;
  }
  await sendMessage(o.telegram_id, text, customerButton(o));
}

const CUSTOMER_STATUS_TEXT: Partial<Record<OrderStatus, (o: Order) => string>> = {
  accepted: (o) => `✅ Buyurtmangiz <b>#${o.id}</b> tasdiqlandi! Tez orada tayyorlashni boshlaymiz.`,
  cooking: (o) => `👨‍🍳 Buyurtmangiz <b>#${o.id}</b> tayyorlanmoqda.`,
  delivering: (o) => `🚚 Buyurtmangiz <b>#${o.id}</b> yo'lga chiqdi! Kuryer tez orada yetib boradi.`,
  ready: (o) =>
    o.order_type === 'dinein'
      ? `🍽 Buyurtmangiz <b>#${o.id}</b> tayyor — stolingiz sizni kutmoqda!`
      : `🛍 Buyurtmangiz <b>#${o.id}</b> tayyor! Olib ketishingiz mumkin.`,
  done: (o) => `🎉 Buyurtma <b>#${o.id}</b> yakunlandi. Yoqimli ishtaha! Bizni tanlaganingiz uchun rahmat 🙏`,
  cancelled: (o) =>
    `❌ Buyurtma <b>#${o.id}</b> bekor qilindi.${o.cancel_reason ? `\nSabab: ${esc(o.cancel_reason)}` : ''}`,
};

export async function notifyCustomerStatus(o: Order) {
  if (!o.telegram_id) return;
  const make = CUSTOMER_STATUS_TEXT[o.status];
  if (!make) return;
  let text = make(o);
  if (o.status === 'cancelled') {
    const s = await getSettings();
    if (s.phones[0]) text += `\nSavollar uchun: ${esc(s.phones[0])}`;
  }
  await sendMessage(o.telegram_id, text, customerButton(o));
}

export async function notifyCustomerPaid(o: Order) {
  if (!o.telegram_id) return;
  await sendMessage(o.telegram_id, `💰 Buyurtma <b>#${o.id}</b> uchun to'lov qabul qilindi. Rahmat!`);
}
