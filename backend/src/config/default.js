const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const list = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const config = {
  botToken: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  // Mini App manzili (Vercel'dagi frontend). Telegram faqat https qabul qiladi.
  webAppUrl: (process.env.WEBAPP_URL || '').replace(/\/$/, ''),
  // Botda "/admin <parol>" bilan admin bo'lish uchun
  adminPassword: process.env.ADMIN_PASSWORD || '',
  // .env orqali belgilangan admin chat ID lari (vergul bilan). Ikkala nom ham ishlaydi:
  // ADMIN_CHAT_IDS (frontend bilan bir xil) yoki ADMIN_IDS. Guruh ID si (-100...) ham bo'lishi mumkin.
  adminIds: [...new Set([...list(process.env.ADMIN_CHAT_IDS), ...list(process.env.ADMIN_IDS)])]
    .map(Number)
    .filter((n) => Number.isSafeInteger(n) && n !== 0),
  // Webhook rejimi (Vercel) uchun
  webhookUrl: process.env.WEBHOOK_URL || '',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  timezone: 'Asia/Tashkent',
};

if (!config.botToken) {
  throw new Error('BOT_TOKEN .env faylida ko\'rsatilmagan');
}
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL .env faylida ko\'rsatilmagan');
}

module.exports = config;
