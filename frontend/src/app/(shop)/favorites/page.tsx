'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { useFavoritesStore } from '@/store/cartStore';
import { useTelegramContext } from '@/providers/TelegramProvider';
import { PageHeader } from '@/components/layout/Header';
import { ProductGrid } from '@/components/features/ProductCard';
import { Button } from '@/components/ui/Button';

export default function FavoritesPage() {
  const router = useRouter();
  const { ready } = useTelegramContext();
  const ids = useFavoritesStore((s) => s.ids);
  const { products } = useMenu();
  const list = products.filter((p) => ids.includes(p.id));

  return (
    <>
      <PageHeader title="Sevimlilar" back={false} />
      <div className="px-4">
        {!ready ? null : list.length ? (
          <ProductGrid products={list} />
        ) : (
          <div className="flex flex-col items-center px-6 pt-14 text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-card">
              <Heart size={40} className="text-chili-500" />
            </div>
            <h2 className="font-display mt-5 text-lg font-extrabold">Sevimli taomlar yo&apos;q</h2>
            <p className="mt-1.5 text-[14px] text-ink-500">Yoqqan taomdagi ♡ belgisini bosing — ular shu yerda saqlanadi</p>
            <Button className="mt-6" onClick={() => router.push('/catalog')}>
              Menyuni ko&apos;rish
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
