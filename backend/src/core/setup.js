const config = require('../config/default');
const logger = require('../utils/logger');

// Bo'sh chatda "Bu bot nima qila oladi?" oynasida ko'rinadi (512 belgigacha)
const DESCRIPTION =
  "🍔 Ansor Burger — Turkiyaning eng mashhur taomlari endi Shahrixonda!\n\n" +
  '🔥 Har doim issiq va yangi tayyorlanadi\n' +
  "🚚 Shahrixon tumani bo'ylab tez yetkazib berish\n" +
  '🗓 Oldindan buyurtma — kelganingizda tayyor turadi\n' +
  "💳 Naqd yoki karta orqali to'lov\n\n" +
  '👇 «Start» tugmasini bosing va menyuni oching!';

// Bot profili va bot havolasi ulashilganda ko'rinadi (120 belgigacha)
const SHORT_DESCRIPTION = "🍔 Mazali turk taomlari • 🚚 Shahrixon bo'ylab yetkazib berish • 🗓 Oldindan buyurtma";

/** Bot buyruqlari, tavsifi va "Menyu" tugmasini (Mini App) sozlaydi */
async function setupBot(bot) {
  await bot.api.setMyDescription(DESCRIPTION).catch((err) => logger.warn('Tavsif saqlanmadi:', err.message));
  await bot.api
    .setMyShortDescription(SHORT_DESCRIPTION)
    .catch((err) => logger.warn('Qisqa tavsif saqlanmadi:', err.message));

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
