/**
 * Mijozning buyurtmalari bilan bog'liq amallar.
 * Savatning o'zi Mini App ichida — bu yerda buyurtmalar tarixi va to'lov cheklari.
 */
const { InlineKeyboard } = require('grammy');
const Order = require('../models/Order');
const User = require('../models/User');
const { STATUS_EMOJI, STATUS_LABEL, dateTime, esc, money, receiptCaption } = require('../utils/format');
const { openApp, hasWebApp, receiptKeyboard } = require('../utils/keyboards');
const config = require('../config/default');
const logger = require('../utils/logger');

async function myOrders(ctx) {
  const orders = await Order.listByTelegramId(ctx.from.id, 5);
  if (!orders.length) {
    return ctx.reply("Siz hali buyurtma bermagansiz. Menyudan mazali taom tanlang! 😋", {
      reply_markup: openApp('🍔 Menyuni ochish'),
    });
  }
  const lines = orders.map(
    (o) =>
      `${STATUS_EMOJI[o.status]} <b>#${o.id}</b> — ${STATUS_LABEL[o.status]}\n` +
      `   ${dateTime(o.created_at)} · ${money(o.total)}\n` +
      `   ${esc(o.items.map((i) => `${i.name} ×${i.qty}`).join(', '))}`
  );
  const kb = new InlineKeyboard();
  if (hasWebApp()) {
    orders.slice(0, 3).forEach((o) => kb.webApp(`📦 #${o.id} ni ochish`, `${config.webAppUrl}/orders/${o.code}`).row());
  }
  return ctx.reply(`<b>Oxirgi buyurtmalaringiz:</b>\n\n${lines.join('\n\n')}`, {
    parse_mode: 'HTML',
    reply_markup: hasWebApp() ? kb : undefined,
  });
}

// Mijoz bir nechta rasmni albom qilib yuborsa, javobni bir marta yozamiz
const albumsAnswered = new Map();

function answeredAlbum(groupId) {
  if (!groupId) return false;
  const now = Date.now();
  for (const [id, at] of albumsAnswered) if (now - at > 60_000) albumsAnswered.delete(id);
  if (albumsAnswered.has(groupId)) return true;
  albumsAnswered.set(groupId, now);
  return false;
}

/**
 * Mijoz to'lov chekini (rasm yoki fayl) yuborsa — rasmning o'zi buyurtma ma'lumotlari
 * va "✅ To'lovni tasdiqlash" tugmasi bilan barcha adminlarga boradi.
 */
async function receipt(ctx) {
  const [unpaid, admins] = await Promise.all([Order.unpaidByTelegramId(ctx.from.id), User.adminIds()]);
  const order = unpaid || (await Order.lastByTelegramId(ctx.from.id));
  const caption = receiptCaption(order, { from: ctx.from, note: ctx.message.caption });
  const payable = order && order.payment_status !== 'paid' && order.status !== 'cancelled';
  const kb = order ? receiptKeyboard(order, { paid: !payable }) : undefined;

  let sent = 0;
  for (const id of admins) {
    try {
      await ctx.api.copyMessage(id, ctx.chat.id, ctx.message.message_id, {
        caption,
        parse_mode: 'HTML',
        reply_markup: kb,
      });
      sent++;
    } catch (err) {
      logger.warn(`Chekni ${id} ga yuborib bo'lmadi:`, err.message);
    }
  }
  if (!admins.length) logger.warn("Chek keldi, lekin adminlar yo'q (ADMIN_CHAT_IDS yoki /admin PAROL)");

  if (answeredAlbum(ctx.message.media_group_id)) return;
  const forOrder = payable ? ` (buyurtma <b>#${order.id}</b>)` : '';
  return ctx.reply(
    sent
      ? `✅ Chek qabul qilindi${forOrder}! Operator tekshirib, to'lovni tasdiqlaydi.`
      : `Chek qabul qilindi${forOrder}. Operator tez orada ko'rib chiqadi.`,
    { parse_mode: 'HTML' }
  );
}

module.exports = { myOrders, receipt };
