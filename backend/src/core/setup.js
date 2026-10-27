const config = require('../config/default');
const logger = require('../utils/logger');

/** Bot buyruqlari va "Menyu" tugmasini (Mini App) sozlaydi */
async function setupBot(bot) {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Bosh menyu' },
    { command: 'menu', description: '🍔 Menyuni ochish' },
    { command: 'orders', description: '📦 Buyurtmalarim' },
    { command: 'contact', description: "📞 Bog'lanish" },
  ]);

  if (config.webAppUrl.startsWith('https://')) {
    await bot.api.setChatMenuButton({
      menu_button: { type: 'web_app', text: 'Menyu', web_app: { url: config.webAppUrl } },
    });
    logger.info(`Menyu tugmasi ulandi: ${config.webAppUrl}`);
  } else {
    logger.warn("WEBAPP_URL https emas — Mini App tugmasi ulanmadi (Vercel manzilini .env ga yozing)");
  }
}

module.exports = { setupBot };
