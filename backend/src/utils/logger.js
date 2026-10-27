const stamp = () =>
  new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', hour12: false }).replace(',', '');

const logger = {
  info: (...args) => console.log(`[${stamp()}] ℹ️ `, ...args),
  warn: (...args) => console.warn(`[${stamp()}] ⚠️ `, ...args),
  error: (...args) => console.error(`[${stamp()}] ❌`, ...args),
};

module.exports = logger;
