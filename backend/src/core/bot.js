const { Bot } = require('grammy');
const config = require('../config/default');
const logger = require('../utils/logger');

const bot = new Bot(config.botToken);

bot.catch((err) => {
  logger.error(`Update ${err.ctx?.update?.update_id} xatosi:`, err.error?.message || err.error);
});

module.exports = bot;
