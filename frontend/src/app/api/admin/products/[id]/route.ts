import { itemHandlers, PRODUCTS } from '@/lib/server/crud';

export const { PATCH, DELETE } = itemHandlers(PRODUCTS);
