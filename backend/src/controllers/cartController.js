/**
 * Mijozning buyurtmalari bilan bog'liq amallar.
 * Savatning o'zi Mini App ichida — bu yerda buyurtmalar tarixi va to'lov cheklari.
 */
const { InlineKeyboard } = require('grammy');
const Order = require('../models/Order');
const User = require('../models/User');
const { STATUS_EMOJI, STATUS_LABEL, dateTime, esc, money } = require('../utils/format');
const { openApp, hasWebApp } = require('../utils/keyboards');
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

/** Mijoz to'lov chekini (rasm) yuborsa — adminlarga jo'natamiz */
async function receipt(ctx) {
  const last = await Order.lastByTelegramId(ctx.from.id);
  const admins = await User.adminIds();
  const who = `${esc(ctx.from.first_name || '')}${ctx.from.username ? ` (@${esc(ctx.from.username)})` : ''}`;
  const caption =
    `🧾 <b>To'lov cheki</b>\nMijoz: ${who}\n` +
    (last
      ? `Oxirgi buyurtma: <b>#${last.id}</b> — ${money(last.total)} (${last.payment_method === 'card' ? 'karta' : 'naqd'}, ${
          last.payment_status === 'paid' ? "to'langan" : "to'lanmagan"
        })`
      : 'Buyurtma topilmadi');
  const kb = last && last.payment_status !== 'paid' ? new InlineKeyboard().text(`💰 #${last.id} to'landi`, `op:${last.id}`) : undefined;

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
  return ctx.reply(
    sent
      ? "✅ Chek qabul qilindi! Operator tekshirib, to'lovni tasdiqlaydi."
      : "Chek qabul qilindi. Operator tez orada ko'rib chiqadi."
  );
}

module.exports = { myOrders, receipt };
