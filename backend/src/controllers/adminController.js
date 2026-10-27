const { InlineKeyboard } = require('grammy');
const config = require('../config/default');
const Order = require('../models/Order');
const User = require('../models/User');
const { CUSTOMER_STATUS_TEXT, STATUS_LABEL, money, orderText } = require('../utils/format');
const { orderAdminKeyboard, trackOrder, hasWebApp } = require('../utils/keyboards');
const logger = require('../utils/logger');

const FLOW = {
  delivery: ['new', 'accepted', 'cooking', 'delivering', 'done'],
  pickup: ['new', 'accepted', 'cooking', 'ready', 'done'],
  dinein: ['new', 'accepted', 'cooking', 'ready', 'done'],
};

function panelButton() {
  return hasWebApp() ? new InlineKeyboard().url('🖥 Admin panelni ochish', `${config.webAppUrl}/admin`) : undefined;
}

/** /admin PAROL — Telegram'da buyurtma xabarlarini olish uchun ro'yxatdan o'tish */
async function register(ctx) {
  const password = String(ctx.match || '').trim();

  if (!password) {
    if (await User.isAdmin(ctx.from.id)) return stats(ctx);
    return ctx.reply("Admin bo'lish uchun: <code>/admin PAROL</code>", { parse_mode: 'HTML' });
  }

  // Parol chatda qolmasligi uchun xabarni o'chiramiz
  await ctx.deleteMessage().catch(() => null);

  if (!config.adminPassword || password !== config.adminPassword) {
    logger.warn(`Noto'g'ri admin parol: ${ctx.from.id}`);
    return ctx.reply("❌ Parol noto'g'ri.");
  }
  const name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Admin';
  await User.addAdmin(ctx.from.id, name);
  return ctx.reply(
    "✅ Siz admin sifatida ro'yxatdan o'tdingiz!\n\nYangi buyurtmalar shu chatga keladi — holatini tugmalar orqali o'zgartirishingiz mumkin.\n\n" +
      'Buyruqlar:\n/stats — bugungi statistika\n/active — faol buyurtmalar\n/unadmin — xabarnomalarni o\'chirish',
    { reply_markup: panelButton() }
  );
}

async function unregister(ctx) {
  await User.removeAdmin(ctx.from.id);
  return ctx.reply("Siz endi buyurtma xabarlarini olmaysiz.");
}

async function stats(ctx) {
  const [s, users] = await Promise.all([Order.todayStats(), User.count()]);
  return ctx.reply(
    `📊 <b>Bugun</b>\n\n` +
      `🛍 Buyurtmalar: <b>${s.orders}</b>\n` +
      `💰 Tushum: <b>${money(s.revenue)}</b>\n` +
      `❌ Bekor qilingan: ${s.cancelled}\n\n` +
      `🆕 Javob kutmoqda: <b>${s.pending}</b>\n` +
      `👨‍🍳 Jarayonda: ${s.active}\n` +
      `👥 Bot foydalanuvchilari: ${users}`,
    { parse_mode: 'HTML', reply_markup: panelButton() }
  );
}

async function active(ctx) {
  const orders = await Order.listActive(10);
  if (!orders.length) return ctx.reply('Faol buyurtmalar yo\'q ✨');
  for (const o of orders) {
    await ctx.reply(orderText(o), {
      parse_mode: 'HTML',
      reply_markup: orderAdminKeyboard(o),
      link_preview_options: { is_disabled: true },
    });
  }
}

async function notifyCustomer(ctx, order, text) {
  if (!order.telegram_id) return;
  try {
    await ctx.api.sendMessage(order.telegram_id, text, { parse_mode: 'HTML', reply_markup: trackOrder(order) });
  } catch (err) {
    logger.warn(`Mijozga (${order.telegram_id}) xabar yuborilmadi:`, err.message);
  }
}

async function refreshMessage(ctx, order) {
  const opts = { parse_mode: 'HTML', reply_markup: orderAdminKeyboard(order), link_preview_options: { is_disabled: true } };
  const msg = ctx.callbackQuery.message;
  try {
    if (msg && (msg.photo || msg.document)) {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await ctx.reply(orderText(order), opts);
    } else {
      await ctx.editMessageText(orderText(order), opts);
    }
  } catch (err) {
    if (!String(err.message).includes('not modified')) logger.warn('Xabarni yangilab bo\'lmadi:', err.message);
  }
}

/** os:<id>:<status> — holatni o'zgartirish */
async function changeStatus(ctx) {
  const [, idStr, status] = ctx.callbackQuery.data.split(':');
  const id = Number(idStr);
  const before = await Order.findById(id);
  if (!before) return ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi', show_alert: true });
  if (!STATUS_LABEL[status]) return ctx.answerCallbackQuery({ text: "Noto'g'ri holat" });

  if (before.status === status) {
    await refreshMessage(ctx, before);
    return ctx.answerCallbackQuery({ text: `Allaqachon: ${STATUS_LABEL[status]}` });
  }
  if (before.status === 'done' || before.status === 'cancelled') {
    await refreshMessage(ctx, before);
    return ctx.answerCallbackQuery({ text: `Buyurtma allaqachon "${STATUS_LABEL[before.status]}"`, show_alert: true });
  }
  if (status !== 'cancelled') {
    const flow = FLOW[before.order_type] || FLOW.delivery;
    if (flow.indexOf(status) <= flow.indexOf(before.status)) {
      await refreshMessage(ctx, before);
      return ctx.answerCallbackQuery({ text: 'Holat allaqachon oldinga o\'tgan', show_alert: true });
    }
  }

  const who = ctx.from.first_name || 'Admin';
  const order = await Order.updateStatus(id, status, status === 'cancelled' ? `${who} tomonidan bekor qilindi` : null);
  await refreshMessage(ctx, order);
  await ctx.answerCallbackQuery({ text: `#${id}: ${STATUS_LABEL[status]}` });

  const make = CUSTOMER_STATUS_TEXT[status];
  if (make) await notifyCustomer(ctx, order, make(order));
}

/** op:<id> — to'landi deb belgilash */
async function markPaid(ctx) {
  const id = Number(ctx.callbackQuery.data.split(':')[1]);
  const before = await Order.findById(id);
  if (!before) return ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi', show_alert: true });
  if (before.payment_status === 'paid') {
    await ctx.answerCallbackQuery({ text: "Allaqachon to'langan" });
  } else {
    const order = await Order.markPaid(id);
    await ctx.answerCallbackQuery({ text: `#${id}: to'landi ✅` });
    await notifyCustomer(ctx, order, `💰 Buyurtma <b>#${id}</b> uchun to'lov qabul qilindi. Rahmat!`);
    if (ctx.callbackQuery.message && !ctx.callbackQuery.message.photo) {
      await refreshMessage(ctx, order);
    } else {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => null);
    }
  }
}

module.exports = { register, unregister, stats, active, changeStatus, markPaid };
