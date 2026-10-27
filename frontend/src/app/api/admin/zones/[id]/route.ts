import { itemHandlers, ZONES } from '@/lib/server/crud';

export const { PATCH, DELETE } = itemHandlers(ZONES);
