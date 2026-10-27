import { collectionHandlers, PRODUCTS } from '@/lib/server/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionHandlers(PRODUCTS);
