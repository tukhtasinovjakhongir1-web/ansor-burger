'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { OrderType, PaymentMethod } from '@/lib/types';

/* ---------------- Savat ---------------- */

export type CartLine = { productId: number; qty: number };

type CartState = {
  lines: CartLine[];
  add: (productId: number, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (productId, qty = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.productId === productId);
          return {
            lines: found
              ? s.lines.map((l) => (l.productId === productId ? { ...l, qty: Math.min(50, l.qty + qty) } : l))
              : [...s.lines, { productId, qty }],
          };
        }),
      setQty: (productId, qty) =>
        set((s) => {
          if (qty <= 0) return { lines: s.lines.filter((l) => l.productId !== productId) };
          const next = Math.min(50, qty);
          // Savatda yo'q bo'lsa — qo'shamiz (mahsulot oynasidan birinchi marta qo'shilganda)
          return s.lines.some((l) => l.productId === productId)
            ? { lines: s.lines.map((l) => (l.productId === productId ? { ...l, qty: next } : l)) }
            : { lines: [...s.lines, { productId, qty: next }] };
        }),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'ab-cart', storage: createJSONStorage(() => localStorage), skipHydration: true }
  )
);

/* ---------------- Sevimlilar ---------------- */

type FavState = { ids: number[]; toggle: (id: number) => void };

export const useFavoritesStore = create<FavState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
    }),
    { name: 'ab-favorites', storage: createJSONStorage(() => localStorage), skipHydration: true }
  )
);

/* ---------------- Mijoz ma'lumotlari (keyingi safar uchun eslab qolinadi) ---------------- */

type ProfileState = {
  name: string;
  phone: string;
  zoneId: number | null;
  address: string;
  landmark: string;
  orderType: OrderType;
  payment: PaymentMethod;
  orderCodes: string[];
  update: (patch: Partial<Omit<ProfileState, 'update' | 'addOrder'>>) => void;
  addOrder: (code: string) => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      phone: '',
      zoneId: null,
      address: '',
      landmark: '',
      orderType: 'delivery',
      payment: 'cash',
      orderCodes: [],
      update: (patch) => set(patch),
      addOrder: (code) => set((s) => ({ orderCodes: [code, ...s.orderCodes.filter((c) => c !== code)].slice(0, 50) })),
    }),
    { name: 'ab-profile', storage: createJSONStorage(() => localStorage), skipHydration: true }
  )
);

export function rehydrateStores() {
  useCartStore.persist.rehydrate();
  useFavoritesStore.persist.rehydrate();
  useProfileStore.persist.rehydrate();
}
