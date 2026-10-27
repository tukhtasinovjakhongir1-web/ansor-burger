'use client';

import { useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useMenu } from '@/providers/MenuProvider';
import type { Product } from '@/lib/types';

export type CartItem = { product: Product; qty: number; total: number };

/** Savat: narxlar har doim menyudagi joriy narxdan olinadi */
export function useCart() {
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const { productById } = useMenu();

  return useMemo(() => {
    const items: CartItem[] = [];
    const unavailable: Product[] = [];
    for (const l of lines) {
      const p = productById.get(l.productId);
      if (!p) continue;
      if (!p.is_available) {
        unavailable.push(p);
        continue;
      }
      items.push({ product: p, qty: l.qty, total: p.price * l.qty });
    }
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const qtyOf = (id: number) => lines.find((l) => l.productId === id)?.qty ?? 0;
    return { items, unavailable, count, subtotal, qtyOf, add, setQty, remove, clear };
  }, [lines, productById, add, setQty, remove, clear]);
}
