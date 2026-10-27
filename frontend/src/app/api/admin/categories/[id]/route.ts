import { itemHandlers, CATEGORIES } from '@/lib/server/crud';

export const { PATCH, DELETE } = itemHandlers(CATEGORIES);
