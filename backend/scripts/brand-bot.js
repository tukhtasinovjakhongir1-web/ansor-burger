/**
 * Bot avatarini (profil rasmi) va tavsifini yangilash — bir marta ishga tushiriladi:
 *   npm run bot:brand
 * Har ishga tushirishda yangi avatar qo'shiladi, shuning uchun takror-takror ishlatmang.
 */
const path = require('path');
const { Bot, InputFile } = require('grammy');
const config = require('../src/config/default');
const { setupBot } = require('../src/core/setup');

async function main() {
  const bot = new Bot(config.botToken);
  await bot.api.setMyProfilePhoto({
    type: 'static',
    photo: new InputFile(path.join(__dirname, '..', 'assets', 'bot-avatar.jpg')),
  });
  console.log('✓ Bot avatari yangilandi');
  await setupBot(bot);
  console.log('✓ Tavsif, buyruqlar va Menyu tugmasi yangilandi');
}

main().catch((err) => {
  console.error('Xatolik:', err.message);
  process.exit(1);
});
