'use client';

import { useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTelegramBackButton } from '@/hooks/useTelegram';
import { ProductSheet } from '@/components/features/ProductSheet';
import { Toaster } from '@/components/ui/Toast';
import { BottomNavigation } from './BottomNavigation';

/** Mijoz qismi uchun umumiy karkas: mobil kenglik, pastki menyu, mahsulot oynasi */
export function ShopChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideNav = pathname.startsWith('/checkout');

  const onBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);
  useTelegramBackButton(pathname !== '/', onBack);

  return (
    <div className="relative mx-auto min-h-dvh max-w-md bg-app sm:shadow-[0_0_60px_-20px_rgba(214,98,30,0.3)]">
      <main className={hideNav ? 'pb-6' : 'pb-32'}>{children}</main>
      {!hideNav && <BottomNavigation />}
      <ProductSheet />
      <Toaster />
    </div>
  );
}
