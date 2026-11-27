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

/** Uzun matnni qisqartiradi (emoji yarmida kesilmasligi uchun belgilar bo'yicha) */
function clip(value, max) {
  const chars = Array.from(String(value ?? ''));
  return max && chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('');
}

/**
 * Buyurtma matni. maxItems — nechta mahsulot ko'rsatilsin (qolgani "… va yana N ta"),
 * cut — manzil/izoh kabi uzun maydonlarni shu uzunlikkacha qisqartirish (rasm izohi uchun).
 */
function orderText(o, { maxItems = Infinity, cut = 0 } = {}) {
  const t = (v) => esc(clip(v, cut));
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
    if (o.zone_name) lines.push(`📍 ${t(o.zone_name)}`);
    if (o.address) lines.push(`🏠 ${t(o.address)}`);
    if (o.landmark) lines.push(`🧭 Mo'ljal: ${t(o.landmark)}`);
    if (o.lat && o.lng) lines.push(`🗺 <a href="https://maps.google.com/?q=${o.lat},${o.lng}">Xaritada ko'rish</a>`);
  }
  if (o.order_type === 'dinein' && o.guests) lines.push(`👥 ${o.guests} kishi`);
  lines.push('', '<b>Tarkibi:</b>');
  const items = o.items || [];
  const shown = items.slice(0, maxItems);
  for (const it of shown) lines.push(`• ${esc(it.name)} × ${it.qty} = ${money(it.total)}`);
  if (items.length > shown.length) lines.push(`… va yana ${items.length - shown.length} ta mahsulot`);
  lines.push('', `Mahsulotlar: ${money(o.subtotal)}`);
  if (o.order_type === 'delivery') lines.push(`Yetkazish: ${o.delivery_fee ? money(o.delivery_fee) : 'bepul'}`);
  lines.push(`<b>Jami: ${money(o.total)}</b>`);
  lines.push(paymentLine(o));
  if (o.comment) lines.push(`💬 ${t(o.comment)}`);
  if (o.status === 'cancelled' && o.cancel_reason) lines.push(`❗️ Sabab: ${t(o.cancel_reason)}`);
  return lines.join('\n');
}

function paymentLine(o) {
  return o.payment_method === 'card'
    ? `💳 Karta — ${o.payment_status === 'paid' ? "to'langan ✅" : "to'lov kutilmoqda"}`
    : `💵 Naqd${o.change_from ? ` (${money(o.change_from)} dan qaytim)` : ''}${o.payment_status === 'paid' ? " — to'langan ✅" : ''}`;
}

// Telegram rasm izohi 1024 belgigacha (teglarsiz). Emoji 2 belgi sanaladi — biroz zaxira qoldiramiz.
const CAPTION_LIMIT = 1000;

const visibleLength = (html) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').length;

/**
 * Rasm ostidagi buyurtma matni: 1024 belgiga sig'masa avval uzun maydonlar,
 * keyin mahsulotlar ro'yxati qisqartiriladi. Mini App'dagi orderCaption bilan bir xil.
 */
function orderCaption(o, header = '') {
  const count = (o.items || []).length;
  const attempts = [{}, { cut: 150 }];
  for (let k = count - 1; k >= 0; k--) attempts.push({ cut: 150, maxItems: k });
  attempts.push({ cut: 60, maxItems: 0 });
  let text = '';
  for (const opts of attempts) {
    text = header + orderText(o, opts);
    if (visibleLength(text) <= CAPTION_LIMIT) return text;
  }
  return text;
}

/** Mijoz yuborgan to'lov cheki rasmi ostidagi matn */
function receiptCaption(o, { from, note } = {}) {
  const sender = from
    ? `${esc(clip([from.first_name, from.last_name].filter(Boolean).join(' '), 40))}${
        from.username ? ` (@${esc(from.username)})` : ''
      }`
    : '';
  const lines = [];
  if (!o) {
    lines.push("🧾 <b>To'lov cheki</b>", '', `👤 ${sender}`, '', '⚠️ Bu mijozning buyurtmasi topilmadi');
  } else {
    const typeIcon = o.order_type === 'delivery' ? '🚚' : o.order_type === 'pickup' ? '🛍' : '🍽';
    const items = (o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ');
    lines.push(
      `🧾 <b>To'lov cheki — buyurtma #${o.id}</b>`,
      '',
      `👤 ${esc(o.customer_name)}${o.username ? ` (@${esc(o.username)})` : ''}`,
      `📞 ${esc(o.phone)}`,
      `${typeIcon} ${ORDER_TYPE_LABEL[o.order_type]} · ${STATUS_EMOJI[o.status]} ${esc(STATUS_LABEL[o.status])}`,
      `🕒 ${dateTime(o.created_at)}`,
      '',
      `🍔 ${esc(clip(items, 300))}`,
      `<b>Jami: ${money(o.total)}</b>`,
      paymentLine(o)
    );
  }
  if (note) lines.push(`💬 Mijoz izohi: ${esc(clip(note, 200))}`);
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

module.exports = {
  STATUS_LABEL,
  STATUS_EMOJI,
  ORDER_TYPE_LABEL,
  CUSTOMER_STATUS_TEXT,
  esc,
  clip,
  money,
  dateTime,
  orderText,
  orderCaption,
  receiptCaption,
};
