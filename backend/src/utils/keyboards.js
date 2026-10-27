const { InlineKeyboard, Keyboard } = require('grammy');
const config = require('../config/default');

const hasWebApp = () => config.webAppUrl.startsWith('https://');

const BTN = {
  menu: '🍔 Menyu',
  orders: '📦 Buyurtmalarim',
  contact: '📞 Aloqa',
  address: '📍 Manzil',
  about: 'ℹ️ Biz haqimizda',
  phone: '📱 Raqamni yuborish',
};

function mainMenu({ askPhone = false } = {}) {
  const kb = new Keyboard().text(BTN.menu).row().text(BTN.orders).text(BTN.contact).row().text(BTN.address).text(BTN.about);
  if (askPhone) kb.row().requestContact(BTN.phone);
  return kb.resized().persistent();
}

/** Mini App'ni ochuvchi inline tugma (initData faqat inline/menyu tugmasida keladi) */
function openApp(text = '🍔 Menyuni ochish', path = '/') {
  if (!hasWebApp()) return undefined;
  return new InlineKeyboard().webApp(text, config.webAppUrl + path);
}

/** Admin uchun buyurtma tugmalari */
function orderAdminKeyboard(o) {
  const kb = new InlineKeyboard();
  const cb = (s) => `os:${o.id}:${s}`;
  if (o.status === 'new') kb.text('✅ Qabul qilish', cb('accepted')).row();
  if (o.status === 'accepted') kb.text('👨‍🍳 Tayyorlanmoqda', cb('cooking')).row();
  if (o.status === 'cooking') {
    if (o.order_type === 'delivery') kb.text("🚚 Yo'lga chiqdi", cb('delivering')).row();
    else kb.text('🛍 Tayyor', cb('ready')).row();
  }
  if (o.status === 'delivering' || o.status === 'ready') kb.text('🎉 Yakunlandi', cb('done')).row();
  if (o.payment_status !== 'paid' && o.status !== 'cancelled') kb.text("💰 To'landi deb belgilash", `op:${o.id}`).row();
  if (o.status !== 'done' && o.status !== 'cancelled') kb.text('❌ Bekor qilish', cb('cancelled')).row();
  if (hasWebApp()) kb.url('🖥 Admin panel', `${config.webAppUrl}/admin/orders?id=${o.id}`);
  return kb;
}

function trackOrder(o) {
  if (!hasWebApp()) return undefined;
  return new InlineKeyboard().webApp('📦 Buyurtmani kuzatish', `${config.webAppUrl}/orders/${o.code}`);
}

module.exports = { BTN, mainMenu, openApp, orderAdminKeyboard, trackOrder, hasWebApp };
