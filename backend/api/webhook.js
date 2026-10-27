/**
 * Vercel serverless funksiyasi: Telegram webhook.
 * Manzil: https://<backend-loyiha>.vercel.app/api/webhook
 */
const bot = require('../src/routes/bot.routes');
const config = require('../src/config/default');
const logger = require('../src/utils/logger');

let ready;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('Ansor Burger bot ishlayapti ✅');
  }
  if (config.webhookSecret && req.headers['x-telegram-bot-api-secret-token'] !== config.webhookSecret) {
    return res.status(401).send('unauthorized');
  }
  try {
    ready ??= bot.init();
    await ready;
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await bot.handleUpdate(update);
  } catch (err) {
    ready = undefined;
    logger.error('Webhook xatosi:', err.message);
  }
  return res.status(200).json({ ok: true });
};
