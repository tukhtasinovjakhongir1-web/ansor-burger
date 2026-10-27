import 'server-only';
import { one, q } from './db';
import type { Category, Menu, Product, Settings, Zone } from '../types';

export const DEFAULT_SETTINGS: Settings = {
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
  card_number: '8600 1234 5678 9012',
  card_holder: 'ANSOR BURGER (TEST)',
  free_delivery_from: 150000,
  prep_minutes: 20,
  promo_title: "Ansor set — 30 000 so'm",
  promo_text: 'Tovuqli non burger + fri + sous + Pepsi',
  promo_product: 'ansor-set',
};

export async function getSettings(): Promise<Settings> {
  const row = await one<{ data: Partial<Settings> }>('SELECT data FROM settings WHERE id = 1');
  return { ...DEFAULT_SETTINGS, ...(row?.data || {}) };
}

export async function saveSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await q(
    `INSERT INTO settings (id, data) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = $1::jsonb`,
    [JSON.stringify(next)]
  );
  return next;
}

export async function getMenu(): Promise<Menu> {
  const [categories, products, zones, settings] = await Promise.all([
    q<Category>('SELECT * FROM categories WHERE is_active ORDER BY sort, id'),
    q<Product>('SELECT * FROM products WHERE is_active ORDER BY sort, id'),
    q<Zone>('SELECT * FROM zones WHERE is_active ORDER BY sort, id'),
    getSettings(),
  ]);
  return { categories, products, zones, settings };
}
