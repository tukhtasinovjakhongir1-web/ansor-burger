import 'server-only';
import { one, q } from './db';

/**
 * Menyu yangilanishlari — bazaga BIR MARTA avtomatik yoziladi.
 *
 * Sayt ishga tushganda `settings.data.menu_version` tekshiriladi: u MENU_VERSION dan kichik bo'lsa,
 * quyidagi narxlar/mahsulotlar bazaga yoziladi va versiya oshiriladi. Shundan keyin admin paneldagi
 * har qanday o'zgarish (narx, rasm, nom, yashirish) saqlanib qoladi — bu kod uni qayta yozmaydi.
 *
 * Yangi narxlar ro'yxati kelganda: ITEMS ni yangilang va MENU_VERSION ni 1 ga oshiring.
 */
export const MENU_VERSION = 2;

type CategorySeed = { slug: string; name: string; emoji: string; image: string; sort: number };
type ItemSeed = {
  slug: string;
  category: string;
  name: string;
  description: string;
  price: number;
  /** true — narxni ega aytmagan, admin panelda «taxminiy narx» belgisi chiqadi */
  approx?: boolean;
  image: string;
  sort: number;
};

const img = (name: string) => `/images/products/${name}_thumb.webp`;

const NEW_CATEGORIES: CategorySeed[] = [
  { slug: 'hot-dog', name: 'Hot-doglar', emoji: '🌭', image: img('hot-dog'), sort: 2 },
  { slug: 'energetik', name: 'Energetiklar (18+)', emoji: '⚡', image: img('adrenalin'), sort: 8 },
];

/** Faqat nomi hali boshlang'ich holatda bo'lsa o'zgartiriladi */
const CATEGORY_RENAMES: { slug: string; from: string; to: string }[] = [
  { slug: 'burger', from: 'Burger va hot-dog', to: 'Burgerlar' },
  { slug: 'lavash-tost', from: 'Lavash va tostlar', to: 'Lavash, durum va tost' },
];

const ENERGY_NOTE = 'Energetik ichimlik. Faqat 18 yoshdan kattalarga sotiladi';

const ITEMS: ItemSeed[] = [
  // Non burgerlar
  { slug: 'kabobli-non-burger', category: 'non-burger', name: 'Non burger katta', description: "Turk noni (somun) ichida go'sht, salat bargi, piyoz, ko'katlar, ketchup va mayonez — katta porsiya", price: 35000, image: img('kabobli-non-burger'), sort: 1 },
  { slug: 'tovuqli-non-burger', category: 'non-burger', name: 'Non burger kichik', description: "Turk noni (somun) ichida go'sht, salat, pomidor, tuzlangan bodring, ketchup va mayonez — kichik porsiya", price: 25000, image: img('tovuqli-non-burger'), sort: 2 },

  // Hot-doglar
  { slug: 'hot-dog', category: 'hot-dog', name: 'Hot-dog sosiskali', description: 'Bulochka, sosiska, pomidor, karam, salat, ketchup, mayonez va kartoshka somoni', price: 13000, image: img('hot-dog'), sort: 5 },
  { slug: 'hot-dog-dvaynoy', category: 'hot-dog', name: 'Hot-dog dvaynoy sosiska', description: 'Ikki dona sosiska, yangi sabzavotlar, ketchup va mayonez', price: 16000, image: img('hot-dog-dvaynoy'), sort: 5 },
  { slug: 'hot-dog-kolbasali', category: 'hot-dog', name: 'Hot-dog kolbasali', description: 'Kolbasa, pishloq, sabzavotlar, ketchup va mayonez', price: 16000, image: img('hot-dog-kolbasali'), sort: 5 },
  { slug: 'hot-dog-goshtli', category: 'hot-dog', name: "Hot-dog go'shtli", description: "Mol go'shti, sabzavotlar, ketchup va mayonez", price: 25000, image: img('hot-dog-goshtli'), sort: 5 },
  { slug: 'hot-dog-qazili', category: 'hot-dog', name: 'Hot-dog qazili', description: 'Qazi, piyoz, sabzavotlar, ketchup va mayonez', price: 27000, image: img('hot-dog-qazili'), sort: 5 },
  { slug: 'hot-dog-tovuqli', category: 'hot-dog', name: 'Hot-dog tovuqli', description: 'Tovuq go\'shti, salat, pomidor, ketchup va mayonez', price: 27000, image: img('hot-dog-tovuqli'), sort: 5 },
  { slug: 'hot-dog-kabobli', category: 'hot-dog', name: 'Hot-dog kabobli', description: 'Kabob, piyoz, ko\'katlar, ketchup va mayonez', price: 27000, image: img('hot-dog-kabobli'), sort: 5 },

  // Lavash, durum va tost
  { slug: 'goshtli-lavash', category: 'lavash-tost', name: 'Lavash', description: "Go'sht, kartoshka fri, bodring, pomidor, pishloq, ketchup va mayonez", price: 35000, image: img('goshtli-lavash'), sort: 6 },
  { slug: 'big-lavash', category: 'lavash-tost', name: 'Big lavash', description: "Katta lavash: ko'proq go'sht, kartoshka fri, sabzavotlar, pishloq va sous", price: 35000, image: img('big-lavash'), sort: 6 },
  { slug: 'mini-lavash', category: 'lavash-tost', name: 'Mini lavash', description: "Kichik lavash: go'sht, kartoshka fri, sabzavotlar va sous", price: 25000, approx: true, image: img('mini-lavash'), sort: 6 },
  { slug: 'tandir-lavash', category: 'lavash-tost', name: 'Tandir lavash', description: "Tandirda pishirilgan lavash: go'sht, sabzavotlar, pishloq va sous", price: 38000, image: img('tandir-lavash'), sort: 6 },
  { slug: 'kfc-lavash', category: 'lavash-tost', name: 'KFC lavash', description: 'Qarsildoq KFC tovuq, kartoshka fri, salat, pomidor va sous', price: 35000, image: img('kfc-lavash'), sort: 6 },
  { slug: 'durum-tovuqli', category: 'lavash-tost', name: 'Durum tovuqli', description: 'Yupqa lavashda tovuq doner, sabzavotlar va sous', price: 25000, image: img('durum-tovuqli'), sort: 7 },
  { slug: 'durum-goshtli', category: 'lavash-tost', name: "Durum go'shtli", description: "Yupqa lavashda go'sht doner, sabzavotlar va sous", price: 25000, image: img('durum-goshtli'), sort: 7 },
  { slug: 'toster', category: 'lavash-tost', name: "To'stir", description: 'Grilda qizartirilgan non bo\'laklari ustida kabob, qatiq sousi, achchiq va pishloqli sous, ukrop', price: 38000, image: img('toster'), sort: 7 },

  // Tovuq
  { slug: 'krilshka', category: 'tovuq', name: 'KFC', description: "Qarsildoq qovurilgan tovuq bo'laklari, ketchup-mayonez va achchiq sous", price: 30000, image: img('krilshka'), sort: 15 },

  // Ichimliklar — narxlar egasi tomonidan aytilmagan (taxminiy)
  { slug: 'pepsi', category: 'ichimlik', name: 'Pepsi 0.5 L', description: 'Sovuq gazli ichimlik 0.5 L', price: 8000, approx: true, image: img('pepsi'), sort: 23 },
  { slug: 'pepsi-1l', category: 'ichimlik', name: 'Pepsi 1 L', description: 'Sovuq gazli ichimlik 1 L', price: 12000, approx: true, image: img('pepsi'), sort: 23 },
  { slug: 'pepsi-1-5l', category: 'ichimlik', name: 'Pepsi 1.5 L', description: 'Sovuq gazli ichimlik 1.5 L', price: 15000, approx: true, image: img('pepsi'), sort: 23 },
  { slug: 'coca-cola-05', category: 'ichimlik', name: 'Coca-Cola 0.5 L', description: 'Sovuq gazli ichimlik 0.5 L', price: 8000, approx: true, image: img('coca-cola'), sort: 23 },
  { slug: 'coca-cola-1l', category: 'ichimlik', name: 'Coca-Cola 1 L', description: 'Sovuq gazli ichimlik 1 L', price: 12000, approx: true, image: img('coca-cola'), sort: 23 },
  { slug: 'coca-cola-1-5l', category: 'ichimlik', name: 'Coca-Cola 1.5 L', description: 'Sovuq gazli ichimlik 1.5 L', price: 15000, approx: true, image: img('coca-cola'), sort: 23 },
  { slug: 'fanta-05', category: 'ichimlik', name: 'Fanta 0.5 L', description: 'Sovuq gazli ichimlik 0.5 L', price: 8000, approx: true, image: img('fanta'), sort: 23 },
  { slug: 'fanta-1l', category: 'ichimlik', name: 'Fanta 1 L', description: 'Sovuq gazli ichimlik 1 L', price: 12000, approx: true, image: img('fanta'), sort: 23 },
  { slug: 'fanta-1-5l', category: 'ichimlik', name: 'Fanta 1.5 L', description: 'Sovuq gazli ichimlik 1.5 L', price: 15000, approx: true, image: img('fanta'), sort: 23 },
  { slug: 'viko-sok', category: 'ichimlik', name: 'Viko sok', description: 'Meva sharbati', price: 18000, approx: true, image: img('viko-sok'), sort: 23 },
  { slug: 'garden-katta', category: 'ichimlik', name: 'Garden sok (katta)', description: 'Meva sharbati, katta', price: 18000, approx: true, image: img('garden-katta'), sort: 23 },
  { slug: 'garden-kichik', category: 'ichimlik', name: 'Garden sok (kichik)', description: 'Meva sharbati, kichik', price: 7000, approx: true, image: img('garden-kichik'), sort: 23 },
  { slug: 'ays-choy', category: 'ichimlik', name: 'Ays choy', description: 'Sovuq choy (Ice tea)', price: 10000, approx: true, image: img('ays-choy'), sort: 23 },

  // Energetiklar
  { slug: 'adrenalin', category: 'energetik', name: 'Adrenalin', description: ENERGY_NOTE, price: 18000, approx: true, image: img('adrenalin'), sort: 24 },
  { slug: 'gorilla', category: 'energetik', name: 'Gorilla', description: ENERGY_NOTE, price: 13000, approx: true, image: img('gorilla'), sort: 24 },
  { slug: 'flash', category: 'energetik', name: 'Flash', description: ENERGY_NOTE, price: 12000, approx: true, image: img('flash'), sort: 24 },
];

/** Egasining ro'yxatida yo'q, ro'yxatdagi mahsulot bilan to'qnashadigan taxminiy mahsulotlar — yashiriladi
 *  (o'chirilmaydi: admin panelda «Ko'rinadi» tugmasi bilan qaytarish mumkin) */
const HIDE_IF_UNTOUCHED = ['tovuqli-lavash'];

async function applyMenuUpdate() {
  for (const c of NEW_CATEGORIES) {
    await q(
      `INSERT INTO categories (slug, name, emoji, image, sort) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING`,
      [c.slug, c.name, c.emoji, c.image, c.sort]
    );
  }
  for (const r of CATEGORY_RENAMES) {
    await q('UPDATE categories SET name = $1 WHERE slug = $2 AND name = $3', [r.to, r.slug, r.from]);
  }

  const cats = await q<{ id: number; slug: string }>('SELECT id, slug FROM categories');
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  for (const it of ITEMS) {
    // Mavjud mahsulot: narx/nom/tavsif yangilanadi, rasm (admin yuklagan bo'lsa) saqlanadi
    await q(
      `INSERT INTO products (slug, category_id, name, description, price, image, price_note, sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         category_id = EXCLUDED.category_id,
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         price       = EXCLUDED.price,
         price_note  = EXCLUDED.price_note,
         sort        = EXCLUDED.sort,
         image       = COALESCE(NULLIF(products.image, ''), EXCLUDED.image),
         is_active   = TRUE`,
      [it.slug, catId[it.category] ?? null, it.name, it.description, it.price, it.image, it.approx ? 'taxminiy' : null, it.sort]
    );
  }

  await q(`UPDATE products SET is_active = FALSE WHERE slug = ANY($1::text[]) AND price_note = 'taxminiy'`, [
    HIDE_IF_UNTOUCHED,
  ]);

  await q(
    `INSERT INTO settings (id, data) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = settings.data || $1::jsonb`,
    [JSON.stringify({ menu_version: MENU_VERSION })]
  );
}

let running: Promise<boolean> | null = null;

/** Kerak bo'lsa menyu yangilanishini bir marta qo'llaydi. true — hozir qo'llandi. */
export function ensureMenuUpToDate(currentVersion: number | undefined): Promise<boolean> {
  if ((currentVersion ?? 0) >= MENU_VERSION) return Promise.resolve(false);
  if (!running) {
    running = (async () => {
      // Boshqa instansiya allaqachon yangilagan bo'lishi mumkin
      const row = await one<{ v: number | null }>(`SELECT (data->>'menu_version')::int AS v FROM settings WHERE id = 1`);
      if ((row?.v ?? 0) >= MENU_VERSION) return false;
      await applyMenuUpdate();
      return true;
    })()
      .catch((err) => {
        console.error('Menyu yangilanishida xatolik:', err);
        return false;
      })
      .finally(() => {
        running = null;
      });
  }
  return running;
}
