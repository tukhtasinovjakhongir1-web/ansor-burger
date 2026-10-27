/** Barcha handlerlar shu yerda ulanadi */
const bot = require('../core/bot');
const { trackUser, requireAdmin } = require('../middlewares/auth.middleware');
const startController = require('../controllers/startController');
const cartController = require('../controllers/cartController');
const adminController = require('../controllers/adminController');
const { BTN } = require('../utils/keyboards');

const privateChat = bot.chatType('private');

privateChat.use(trackUser);

// Buyruqlar
privateChat.command('start', startController.start);
privateChat.command('menu', startController.menu);
privateChat.command('orders', cartController.myOrders);
privateChat.command('contact', startController.contacts);

// Admin
privateChat.command('admin', adminController.register);
privateChat.command('stats', requireAdmin, adminController.stats);
privateChat.command('active', requireAdmin, adminController.active);
privateChat.command('unadmin', requireAdmin, adminController.unregister);

// Pastki menyu tugmalari
privateChat.hears(BTN.menu, startController.menu);
privateChat.hears(BTN.orders, cartController.myOrders);
privateChat.hears(BTN.contact, startController.contacts);
privateChat.hears(BTN.address, startController.address);
privateChat.hears(BTN.about, startController.about);

privateChat.on('message:contact', startController.contactShared);

// To'lov cheki (rasm yoki fayl)
privateChat.on(['message:photo', 'message:document'], cartController.receipt);

// Admin tugmalari
bot.callbackQuery(/^os:\d+:[a-z]+$/, requireAdmin, adminController.changeStatus);
bot.callbackQuery(/^op:\d+$/, requireAdmin, adminController.markPaid);
bot.on('callback_query:data', (ctx) => ctx.answerCallbackQuery());

// Boshqa matnlar
privateChat.on('message:text', (ctx) =>
  ctx.reply("Buyurtma berish uchun «🍔 Menyu» tugmasini bosing 👇")
);

module.exports = bot;
