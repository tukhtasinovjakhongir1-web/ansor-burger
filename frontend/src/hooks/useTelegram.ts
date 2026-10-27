'use client';

import { useCallback, useEffect } from 'react';
import { useTelegramContext } from '@/providers/TelegramProvider';

export function useTelegram() {
  const { webApp, isTelegram, ready } = useTelegramContext();
  const user = isTelegram ? webApp?.initDataUnsafe.user ?? null : null;

  const haptic = useCallback(
    (kind: 'light' | 'medium' | 'success' | 'error' | 'select' = 'light') => {
      if (!isTelegram || !webApp?.isVersionAtLeast('6.1')) return;
      const h = webApp.HapticFeedback;
      if (kind === 'success' || kind === 'error') h.notificationOccurred(kind);
      else if (kind === 'select') h.selectionChanged();
      else h.impactOccurred(kind);
    },
    [webApp, isTelegram]
  );

  /** Telegram'dagi raqamni so'rash (Bot API 6.9+) */
  const requestPhone = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        if (!isTelegram || !webApp?.requestContact || !webApp.isVersionAtLeast('6.9')) return resolve(null);
        webApp.requestContact((ok, res) => resolve(ok ? res?.responseUnsafe?.contact?.phone_number ?? null : null));
      }),
    [webApp, isTelegram]
  );

  const openLink = useCallback(
    (url: string) => {
      if (isTelegram && webApp) {
        if (url.startsWith('https://t.me/')) webApp.openTelegramLink(url);
        else webApp.openLink(url);
      } else window.open(url, '_blank', 'noopener');
    },
    [webApp, isTelegram]
  );

  return {
    webApp,
    isTelegram,
    ready,
    user,
    initData: isTelegram ? webApp?.initData ?? '' : '',
    haptic,
    requestPhone,
    openLink,
  };
}

/** Telegram'ning yuqoridagi "Orqaga" tugmasini boshqaradi */
export function useTelegramBackButton(visible: boolean, onBack: () => void) {
  const { webApp, isTelegram } = useTelegramContext();
  useEffect(() => {
    if (!isTelegram || !webApp?.isVersionAtLeast('6.1')) return;
    const btn = webApp.BackButton;
    if (visible) {
      btn.show();
      btn.onClick(onBack);
    } else btn.hide();
    return () => {
      btn.offClick(onBack);
    };
  }, [webApp, isTelegram, visible, onBack]);
}
