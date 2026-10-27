/**
 * Webhook'ni o'rnatish (Vercel'ga joylagandan keyin bir marta):
 *   npm run webhook:set       — WEBHOOK_URL ga ulaydi
 *   npm run webhook:delete    — webhook'ni o'chiradi (polling uchun)
 */
const { Bot } = require('grammy');
const config = require('../src/config/default');
const { setupBot } = require('../src/core/setup');

async function main() {
  const bot = new Bot(config.botToken);

  if (process.argv.includes('--delete')) {
    await bot.api.deleteWebhook();
    console.log("✓ Webhook o'chirildi");
    return;
  }

  if (!config.webhookUrl.startsWith('https://')) {
    throw new Error('WEBHOOK_URL .env da ko\'rsatilmagan (masalan https://ansor-burger-bot.vercel.app/api/webhook)');
  }
  await bot.api.setWebhook(config.webhookUrl, {
    secret_token: config.webhookSecret || undefined,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });
  await setupBot(bot);
  const info = await bot.api.getWebhookInfo();
  console.log('✓ Webhook:', info.url, info.last_error_message ? `(oxirgi xato: ${info.last_error_message})` : '');
}

main().catch((err) => {
  console.error('Xatolik:', err.message);
  process.exit(1);
});
