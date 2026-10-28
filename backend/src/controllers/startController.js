const path = require('path');
const { InlineKeyboard, InputFile } = require('grammy');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { mainMenu, openApp, hasWebApp } = require('../utils/keyboards');
const { esc, money } = require('../utils/format');
const { forgetUser } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

const needsPhone = (ctx) => !ctx.dbUser || !ctx.dbUser.phone;

const WELCOME_IMAGE = path.join(__dirname, '..', '..', 'assets', 'welcome.jpg');
// Banner Telegram'ga bir marta yuklanadi, keyin file_id orqali tez yuboriladi
let welcomePhotoId = null;

function welcomeKeyboard(s) {
  const kb = openApp('🍔 Menyuni ochish') || new InlineKeyboard();
  if (s.instagram) kb.row().url('📸 Instagram', `https://www.instagram.com/${encodeURIComponent(s.instagram)}/`);
  return kb.inline_keyboard.some((row) => row.length) ? kb : undefined;
}

async function replyWithBanner(ctx, caption, reply_markup) {
  const other = { caption, parse_mode: 'HTML', reply_markup };
  if (welcomePhotoId) {
    try {
      return await ctx.replyWithPhoto(welcomePhotoId, other);
    } catch {
      welcomePhotoId = null;
    }
  }
  const msg = await ctx.replyWithPhoto(new InputFile(WELCOME_IMAGE), other);
  welcomePhotoId = msg.photo.at(-1).file_id;
  return msg;
}

async function start(ctx) {
  const s = await Setting.get();
  const name = esc(ctx.from.first_name || 'mehmon');
  const caption =
    `Assalomu alaykum, <b>${name}</b>! 👋\n\n` +
    `<b>${esc(s.restaurant_name)}</b>ga xush kelibsiz! 🍔\n` +
    `<i>${esc(s.tagline)}</i>\n\n` +
    `🔥 Har doim issiq va yangi tayyorlanadi\n` +
    `🚚 Shahrixon tumani bo'ylab tez yetkazib beramiz\n` +
    `🗓 Oldindan buyurtma bering — kelganingizda tayyor turadi\n` +
    `💳 Naqd yoki karta orqali to'lov\n` +
    `🕙 Har kuni ${s.open_time} – ${s.close_time}\n\n` +
    (hasWebApp() ? '👇 Menyuni oching va sevimli taomingizni tanlang!' : '⏳ Menyu tez orada shu yerda ochiladi.');
  const kb = welcomeKeyboard(s);

  try {
    await replyWithBanner(ctx, caption, kb);
  } catch (err) {
    logger.warn('Banner yuborilmadi:', err.message);
    await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
  }

  const askPhone = needsPhone(ctx);
  await ctx.reply(
    askPhone
      ? "📱 Buyurtmangiz bo'yicha tez bog'lanishimiz uchun pastdagi tugma orqali raqamingizni yuboring."
      : 'Pastdagi tugmalar orqali ham foydalanishingiz mumkin 👇',
    { reply_markup: mainMenu({ askPhone }) }
  );
}

async function menu(ctx) {
  const kb = openApp('🍔 Menyuni ochish');
  if (!kb) return ctx.reply("Mini App hali ulanmagan (WEBAPP_URL sozlanmagan).");
  return ctx.reply("Menyuni ochib, taomlarni savatga qo'shing 👇", { reply_markup: kb });
}

async function contactShared(ctx) {
  const contact = ctx.message.contact;
  if (contact.user_id && contact.user_id !== ctx.from.id) {
    return ctx.reply("Iltimos, o'zingizning raqamingizni yuboring 🙂");
  }
  const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
  await User.setPhone(ctx.from.id, phone);
  forgetUser(ctx.from.id);
  return ctx.reply(`✅ Rahmat! Raqamingiz saqlandi: ${phone}`, { reply_markup: mainMenu() });
}

async function contacts(ctx) {
  const s = await Setting.get();
  const phones = s.phones.map((p) => `📞 ${esc(p)}`).join('\n');
  return ctx.reply(
    `<b>Biz bilan bog'lanish</b>\n\n${phones}\n🕙 Har kuni ${s.open_time} – ${s.close_time}` +
      (s.instagram ? `\n📸 <a href="https://www.instagram.com/${esc(s.instagram)}/">@${esc(s.instagram)}</a>` : ''),
    { parse_mode: 'HTML', link_preview_options: { is_disabled: true } }
  );
}

async function address(ctx) {
  const s = await Setting.get();
  return ctx.reply(
    `📍 <b>Manzil:</b> ${esc(s.address)}\nAndijon viloyati, Shahrixon tumani\n\n` +
      `🛍 Olib ketish yoki joyida ovqatlanish uchun ilovada oldindan buyurtma bering — kelganingizda tayyor bo'ladi.`,
    { parse_mode: 'HTML', reply_markup: openApp('🗓 Oldindan buyurtma') }
  );
}

async function about(ctx) {
  const [s, zones] = await Promise.all([Setting.get(), Setting.zones()]);
  const list = zones.map((z) => `• ${esc(z.name)} — ${z.fee ? money(z.fee) : 'bepul'}`).join('\n');
  return ctx.reply(
    `<b>${esc(s.restaurant_name)}</b> — ${esc(s.tagline)}\n\n` +
      `🚚 <b>Yetkazib berish hududlari:</b>\n${list || '—'}\n` +
      (s.free_delivery_from ? `\n🎁 ${money(s.free_delivery_from)} dan yuqori buyurtmaga yetkazish bepul!\n` : '') +
      `\n💵 To'lov: naqd yoki karta orqali`,
    { parse_mode: 'HTML', reply_markup: hasWebApp() ? openApp('🍔 Menyuni ochish') : undefined }
  );
}

module.exports = { start, menu, contactShared, contacts, address, about };
