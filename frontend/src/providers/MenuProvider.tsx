'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Category, Menu, Product } from '@/lib/types';

type MenuContextValue = Menu & {
  productById: Map<number, Product>;
  categoryById: Map<number, Category>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ menu, children }: { menu: Menu; children: ReactNode }) {
  const value = useMemo<MenuContextValue>(
    () => ({
      ...menu,
      productById: new Map(menu.products.map((p) => [p.id, p])),
      categoryById: new Map(menu.categories.map((c) => [c.id, c])),
    }),
    [menu]
  );
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu MenuProvider ichida ishlatilishi kerak');
  return ctx;
}
