import { collectionHandlers, PRODUCTS } from '@/lib/server/crud';
import { getSettings } from '@/lib/server/menu';

export const dynamic = 'force-dynamic';

const handlers = collectionHandlers(PRODUCTS);

export async function GET() {
  // Admin menyudan oldin ochilsa ham yangi narxlar ko'rinsin
  await getSettings();
  return handlers.GET();
}

export const { POST } = handlers;
