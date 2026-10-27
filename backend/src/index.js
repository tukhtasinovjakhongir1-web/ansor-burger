/**
 * Botni long polling rejimida ishga tushirish (kompyuter yoki VPS uchun):
 *   npm start
 * Vercel'da esa api/webhook.js ishlatiladi.
 */
const bot = require('./routes/bot.routes');
const { setupBot } = require('./core/setup');
const logger = require('./utils/logger');

async function main() {
  await setupBot(bot).catch((err) => logger.warn('Sozlashda xato:', err.message));
  await bot.start({
    allowed_updates: ['message', 'callback_query'],
    onStart: (me) => logger.info(`@${me.username} ishga tushdi (polling)`),
  });
}

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

main().catch((err) => {
  logger.error('Botni ishga tushirib bo\'lmadi:', err.message);
  process.exit(1);
});
