const User = require('../models/User');
const logger = require('../utils/logger');

// Har bir xabarda bazaga yozmaslik uchun qisqa kesh (serverless'da ham zararsiz)
const seen = new Map();
const TTL = 10 * 60 * 1000;

/** Foydalanuvchini bazada saqlaydi / yangilaydi va bloklanganlarni to'xtatadi */
async function trackUser(ctx, next) {
  const from = ctx.from;
  if (!from || from.is_bot) return next();

  const cached = seen.get(from.id);
  if (!cached || Date.now() - cached.at > TTL) {
    try {
      const user = await User.upsertFromTelegram(from);
      seen.set(from.id, { at: Date.now(), user });
    } catch (err) {
      logger.error('Foydalanuvchini saqlashda xato:', err.message);
    }
  }
  ctx.dbUser = seen.get(from.id)?.user || null;
  if (ctx.dbUser?.is_blocked) return;
  return next();
}

/** Faqat adminlar uchun */
async function requireAdmin(ctx, next) {
  if (ctx.from && (await User.isAdmin(ctx.from.id))) return next();
  if (ctx.callbackQuery) return ctx.answerCallbackQuery({ text: "Bu amal faqat adminlar uchun", show_alert: true });
  return ctx.reply("⛔️ Bu buyruq faqat adminlar uchun. Admin bo'lish: /admin PAROL");
}

function forgetUser(id) {
  seen.delete(id);
}

module.exports = { trackUser, requireAdmin, forgetUser };
