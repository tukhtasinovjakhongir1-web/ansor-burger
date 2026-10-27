const { one, query } = require('../database/connection');

const DEFAULTS = {
  restaurant_name: 'Ansor Burger',
  tagline: 'Turkiyaning eng mashhur taomlari',
  phones: ['+998 95 200 00 54', '+998 33 067 08 08'],
  address: "Shahrixon, Sher ko'prik yonida",
  instagram: 'burger_ansor',
  open_time: '10:00',
  close_time: '01:00',
  free_delivery_from: 150000,
};

const Setting = {
  async get() {
    const row = await one('SELECT data FROM settings WHERE id = 1');
    return { ...DEFAULTS, ...(row ? row.data : {}) };
  },

  async zones() {
    return query('SELECT name, fee, min_order, eta_min FROM zones WHERE is_active ORDER BY sort, id');
  },
};

module.exports = Setting;
