import { collectionHandlers, CATEGORIES } from '@/lib/server/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionHandlers(CATEGORIES);
