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
  // Qo'shimcha: .env orqali oldindan belgilangan admin Telegram ID lari
  adminIds: list(process.env.ADMIN_IDS).map(Number),
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
