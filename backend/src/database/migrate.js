/**
 * Bazani tayyorlash: jadvallarni yaratadi va boshlang'ich ma'lumotlarni yuklaydi.
 * Ishga tushirish:  npm run db:migrate
 * Takroriy ishga tushirish xavfsiz — mavjud ma'lumotlar o'chirilmaydi.
 */
const fs = require('fs');
const path = require('path');
const { query } = require('./connection');
const seed = require('./products.json');

const CATEGORIES = [
  { slug: 'non-burger', name: 'Non burgerlar', emoji: '🥙', image: '/images/products/kabobli-non-burger_thumb.webp' },
  { slug: 'burger', name: 'Burger va hot-dog', emoji: '🍔', image: '/images/products/ansor-burger_thumb.webp' },
  { slug: 'lavash-tost', name: 'Lavash va tostlar', emoji: '🌯', image: '/images/products/goshtli-lavash_thumb.webp' },
  { slug: 'kabob', name: 'Kaboblar', emoji: '🍢', image: '/images/products/adana-kabob_thumb.webp' },
  { slug: 'tovuq', name: 'Tovuq taomlari', emoji: '🍗', image: '/images/products/krilshka_thumb.webp' },
  { slug: 'turk-taomlari', name: 'Turk taomlari', emoji: '🥘', image: '/images/products/tepsi-kabob_thumb.webp' },
  { slug: 'garnir-sous', name: 'Garnir va souslar', emoji: '🍟', image: '/images/products/kartoshka-fri_thumb.webp' },
  { slug: 'ichimlik', name: 'Ichimliklar', emoji: '🥤', image: '/images/products/pepsi_thumb.webp' },
  { slug: 'set', name: 'Setlar', emoji: '🎁', image: '/images/sets/ansor-set_thumb.webp' },
  { slug: 'aksiya', name: 'Aksiyalar', emoji: '🔥', image: '/images/sets/aksiya-3plus1_thumb.webp' },
];

const POPULAR = [
  'kabobli-non-burger',
  'ansor-burger',
  'goshtli-lavash',
  'krilshka',
  'adana-kabob',
  'ansor-set',
  'tost-assorti',
  'dabl-chizburger',
];

// Narxi e'lon qilinmagan mahsulotlar uchun taxminiy narx
const FALLBACK_PRICES = { 'aksiya-3plus1': 75000 };

const ZONES = [
  { name: 'Shahrixon shahri — markaz', fee: 5000, min_order: 20000, eta_min: 30 },
  { name: 'Shahrixon shahri — boshqa mahallalar', fee: 10000, min_order: 30000, eta_min: 40 },
  { name: 'Shahrixon tumani — 5 km gacha qishloqlar', fee: 15000, min_order: 40000, eta_min: 50 },
  { name: 'Shahrixon tumani — 5 km dan uzoq', fee: 20000, min_order: 50000, eta_min: 60 },
];

const DEFAULT_SETTINGS = {
  restaurant_name: 'Ansor Burger',
  tagline: 'Turkiyaning eng mashhur taomlari',
  phones: ['+998 95 200 00 54', '+998 33 067 08 08'],
  address: "Shahrixon, Sher ko'prik yonida",
  instagram: 'burger_ansor',
  open_time: '10:00',
  close_time: '01:00',
  accepting_orders: true,
  delivery_enabled: true,
  pickup_enabled: true,
  dinein_enabled: true,
  cash_enabled: true,
  card_enabled: true,
  // TEST karta — haqiqiysiga admin paneldagi "Sozlamalar" bo'limida almashtiring
  card_number: '8600 1234 5678 9012',
  card_holder: 'ANSOR BURGER (TEST)',
  free_delivery_from: 150000,
  prep_minutes: 20,
  promo_title: "Ansor set — 30 000 so'm",
  promo_text: 'Tovuqli non burger + fri + sous + Pepsi',
  promo_product: 'ansor-set',
};

function splitSql(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  for (const statement of splitSql(schema)) {
    await query(statement);
  }
  console.log('✓ Jadvallar tayyor');

  for (const [i, c] of CATEGORIES.entries()) {
    await query(
      `INSERT INTO categories (slug, name, emoji, image, sort) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING`,
      [c.slug, c.name, c.emoji, c.image, i + 1]
    );
  }
  const cats = await query('SELECT id, slug FROM categories');
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  console.log(`✓ Kategoriyalar: ${cats.length}`);

  let inserted = 0;
  for (const [i, p] of seed.items.entries()) {
    const price = p.price ?? FALLBACK_PRICES[p.id] ?? 0;
    const approximate = p.price_status !== 'tasdiqlangan' || p.price == null;
    const rows = await query(
      `INSERT INTO products (slug, category_id, name, description, price, image, price_note, is_popular, sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO NOTHING RETURNING id`,
      [
        p.id,
        catId[p.category] || null,
        p.name,
        p.description || '',
        price,
        '/' + p.thumb,
        approximate ? 'taxminiy' : null,
        POPULAR.includes(p.id),
        i + 1,
      ]
    );
    inserted += rows.length;
  }
  console.log(`✓ Mahsulotlar: ${inserted} ta yangi qo'shildi`);

  const [{ count }] = await query('SELECT COUNT(*)::int AS count FROM zones');
  if (count === 0) {
    for (const [i, z] of ZONES.entries()) {
      await query(
        'INSERT INTO zones (name, fee, min_order, eta_min, sort) VALUES ($1, $2, $3, $4, $5)',
        [z.name, z.fee, z.min_order, z.eta_min, i + 1]
      );
    }
    console.log(`✓ Yetkazib berish hududlari: ${ZONES.length}`);
  }

  // Mavjud sozlamalar saqlanadi, faqat yetishmayotgan kalitlar qo'shiladi
  await query(
    `INSERT INTO settings (id, data) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = $1::jsonb || settings.data`,
    [JSON.stringify(DEFAULT_SETTINGS)]
  );
  console.log('✓ Sozlamalar');
}

migrate()
  .then(() => {
    console.log('Tayyor!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Xatolik:', err.message);
    process.exit(1);
  });
