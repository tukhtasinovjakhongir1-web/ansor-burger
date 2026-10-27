import { getMenu } from '@/lib/server/menu';
import { MenuProvider } from '@/providers/MenuProvider';
import { TelegramProvider } from '@/providers/TelegramProvider';
import { ShopChrome } from '@/components/layout/ShopChrome';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const menu = await getMenu();
  return (
    <TelegramProvider>
      <MenuProvider menu={menu}>
        <ShopChrome>{children}</ShopChrome>
      </MenuProvider>
    </TelegramProvider>
  );
}
