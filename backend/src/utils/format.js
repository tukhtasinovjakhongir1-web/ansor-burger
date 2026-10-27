/**
 * Buyurtma matnlari. Mini App (frontend/src/lib/server/telegram.ts) bilan bir xil formatda —
 * bot xabarni tahrirlaganda ko'rinishi o'zgarmasligi uchun.
 */

const STATUS_LABEL = {
  new: 'Yangi',
  accepted: 'Qabul qilindi',
  cooking: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  delivering: "Yo'lda",
  done: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
};

const STATUS_EMOJI = {
  new: '🆕',
  accepted: '✅',
  cooking: '👨‍🍳',
  ready: '🛍',
  delivering: '🚚',
  done: '🎉',
  cancelled: '❌',
};

const ORDER_TYPE_LABEL = {
  delivery: 'Yetkazib berish',
  pickup: 'Olib ketish',
  dinein: 'Joyida (stol band)',
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function money(n) {
  return `${Math.round(Number(n) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

const OFFSET = 5 * 60 * 60 * 1000;
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];

function dateTime(value) {
  const d = new Date(value);
  const t = new Date(d.getTime() + OFFSET);
  const now = new Date(Date.now() + OFFSET);
  const dayDiff = Math.floor(t.getTime() / 86400000) - Math.floor(now.getTime() / 86400000);
  const day =
    dayDiff === 0
      ? 'Bugun'
      : dayDiff === 1
        ? 'Ertaga'
        : dayDiff === -1
          ? 'Kecha'
          : `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}`;
  const time = `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
  return `${day}, ${time}`;
}

function orderText(o) {
  const when = o.scheduled_at ? `🗓 ${dateTime(o.scheduled_at)}` : '⚡ Imkon qadar tez';
  const typeIcon = o.order_type === 'delivery' ? '🚚' : o.order_type === 'pickup' ? '🛍' : '🍽';
  const lines = [
    `${STATUS_EMOJI[o.status]} <b>Buyurtma #${o.id}</b> — ${esc(STATUS_LABEL[o.status])}`,
    `${typeIcon} ${ORDER_TYPE_LABEL[o.order_type]} · ${when}`,
    '',
    `👤 ${esc(o.customer_name)}${o.username ? ` (@${esc(o.username)})` : ''}`,
    `📞 ${esc(o.phone)}`,
  ];
  if (o.order_type === 'delivery') {
    if (o.zone_name) lines.push(`📍 ${esc(o.zone_name)}`);
    if (o.address) lines.push(`🏠 ${esc(o.address)}`);
    if (o.landmark) lines.push(`🧭 Mo'ljal: ${esc(o.landmark)}`);
    if (o.lat && o.lng) lines.push(`🗺 <a href="https://maps.google.com/?q=${o.lat},${o.lng}">Xaritada ko'rish</a>`);
  }
  if (o.order_type === 'dinein' && o.guests) lines.push(`👥 ${o.guests} kishi`);
  lines.push('', '<b>Tarkibi:</b>');
  for (const it of o.items || []) lines.push(`• ${esc(it.name)} × ${it.qty} = ${money(it.total)}`);
  lines.push('', `Mahsulotlar: ${money(o.subtotal)}`);
  if (o.order_type === 'delivery') lines.push(`Yetkazish: ${o.delivery_fee ? money(o.delivery_fee) : 'bepul'}`);
  lines.push(`<b>Jami: ${money(o.total)}</b>`);
  lines.push(
    o.payment_method === 'card'
      ? `💳 Karta — ${o.payment_status === 'paid' ? "to'langan ✅" : "to'lov kutilmoqda"}`
      : `💵 Naqd${o.change_from ? ` (${money(o.change_from)} dan qaytim)` : ''}${o.payment_status === 'paid' ? " — to'langan ✅" : ''}`
  );
  if (o.comment) lines.push(`💬 ${esc(o.comment)}`);
  if (o.status === 'cancelled' && o.cancel_reason) lines.push(`❗️ Sabab: ${esc(o.cancel_reason)}`);
  return lines.join('\n');
}

const CUSTOMER_STATUS_TEXT = {
  accepted: (o) => `✅ Buyurtmangiz <b>#${o.id}</b> tasdiqlandi! Tez orada tayyorlashni boshlaymiz.`,
  cooking: (o) => `👨‍🍳 Buyurtmangiz <b>#${o.id}</b> tayyorlanmoqda.`,
  delivering: (o) => `🚚 Buyurtmangiz <b>#${o.id}</b> yo'lga chiqdi! Kuryer tez orada yetib boradi.`,
  ready: (o) =>
    o.order_type === 'dinein'
      ? `🍽 Buyurtmangiz <b>#${o.id}</b> tayyor — stolingiz sizni kutmoqda!`
      : `🛍 Buyurtmangiz <b>#${o.id}</b> tayyor! Olib ketishingiz mumkin.`,
  done: (o) => `🎉 Buyurtma <b>#${o.id}</b> yakunlandi. Yoqimli ishtaha! Bizni tanlaganingiz uchun rahmat 🙏`,
  cancelled: (o) => `❌ Buyurtma <b>#${o.id}</b> bekor qilindi.${o.cancel_reason ? `\nSabab: ${esc(o.cancel_reason)}` : ''}`,
};

module.exports = { STATUS_LABEL, STATUS_EMOJI, ORDER_TYPE_LABEL, CUSTOMER_STATUS_TEXT, esc, money, dateTime, orderText };
