'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { rehydrateStores } from '@/store/cartStore';

type TelegramContextValue = {
  webApp: TelegramWebApp | null;
  /** Mini App Telegram ichida ochilganmi */
  isTelegram: boolean;
  /** localStorage va Telegram tayyor bo'ldimi */
  ready: boolean;
};

const TelegramContext = createContext<TelegramContextValue>({ webApp: null, isTelegram: false, ready: false });

const BG = '#fff4ea';

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>({ webApp: null, isTelegram: false, ready: false });

  useEffect(() => {
    rehydrateStores();
    const wa = window.Telegram?.WebApp ?? null;
    const isTelegram = Boolean(wa && wa.initData);
    if (wa && isTelegram) {
      try {
        wa.ready();
        wa.expand();
        if (wa.isVersionAtLeast('6.1')) {
          wa.setHeaderColor(BG);
          wa.setBackgroundColor(BG);
        }
        if (wa.isVersionAtLeast('7.7')) wa.disableVerticalSwipes?.();
        if (wa.isVersionAtLeast('7.10')) wa.setBottomBarColor?.(BG);
      } catch {
        /* eski Telegram versiyalari */
      }
    }
    setValue({ webApp: wa, isTelegram, ready: true });
  }, []);

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegramContext() {
  return useContext(TelegramContext);
}
