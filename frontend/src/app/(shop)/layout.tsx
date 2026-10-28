import { connection } from 'next/server';
import { getCachedMenu } from '@/lib/server/menu';
import { MenuProvider } from '@/providers/MenuProvider';
import { TelegramProvider } from '@/providers/TelegramProvider';
import { ShopChrome } from '@/components/layout/ShopChrome';

// Sahifalar CDN'dan tayyor holda beriladi va har 60 soniyada (yoki admin o'zgartirganda) yangilanadi
export const revalidate = 60;

async function loadMenu() {
  try {
    return await getCachedMenu();
  } catch (err) {
    // Build paytida baza ulanmagan bo'lsa — sahifalar so'rov vaqtida yaratiladi
    if (process.env.NEXT_PHASE === 'phase-production-build') await connection();
    throw err;
  }
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const menu = await loadMenu();
  return (
    <TelegramProvider>
      <MenuProvider menu={menu}>
        <ShopChrome>{children}</ShopChrome>
      </MenuProvider>
    </TelegramProvider>
  );
}
