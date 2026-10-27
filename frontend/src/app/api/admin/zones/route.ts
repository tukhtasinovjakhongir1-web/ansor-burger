import { collectionHandlers, ZONES } from '@/lib/server/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionHandlers(ZONES);
