/**
 * Botni webhook rejimida HTTP server sifatida ishga tushirish (Render Web Service uchun):
 *   node src/server.js
 * Render PORT va RENDER_EXTERNAL_URL ni o'zi beradi — webhook avtomatik ulanadi.
 * Boshqa hostingda WEBHOOK_URL (to'liq manzil, .../api/webhook) ni ko'rsating.
 */
const http = require('http');
const { webhookCallback } = require('grammy');
const bot = require('./routes/bot.routes');
const config = require('./config/default');
const { setupBot } = require('./core/setup');
const logger = require('./utils/logger');

const PORT = Number(process.env.PORT) || 10000;
const WEBHOOK_PATH = '/api/webhook';
const baseUrl = (process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const webhookUrl = config.webhookUrl || (baseUrl ? `${baseUrl}${WEBHOOK_PATH}` : '');

const handleUpdate = webhookCallback(bot, 'http', {
  secretToken: config.webhookSecret || undefined,
  onTimeout: 'return',
  timeoutMilliseconds: 25_000,
});

const server = http.createServer(async (req, res) => {
  const path = (req.url || '').split('?')[0];
  if (req.method === 'POST' && path === WEBHOOK_PATH) {
    try {
      await handleUpdate(req, res);
    } catch (err) {
      logger.error('Webhook xatosi:', err.message);
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      }
    }
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Ansor Burger bot ishlayapti ✅');
});

server.listen(PORT, async () => {
  logger.info(`HTTP server ${PORT}-portda ishga tushdi`);
  try {
    await bot.init();
    await setupBot(bot).catch((err) => logger.warn('Sozlashda xato:', err.message));
    if (webhookUrl.startsWith('https://')) {
      await bot.api.setWebhook(webhookUrl, {
        secret_token: config.webhookSecret || undefined,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      });
      logger.info(`@${bot.botInfo.username} webhook ulandi: ${webhookUrl}`);
    } else {
      logger.warn('Webhook manzili topilmadi (RENDER_EXTERNAL_URL yoki WEBHOOK_URL kerak)');
    }
  } catch (err) {
    logger.error("Botni sozlab bo'lmadi:", err.message);
  }
});

const shutdown = () => server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
