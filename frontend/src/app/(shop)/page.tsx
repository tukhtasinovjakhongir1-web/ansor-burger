'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { HomeHeader } from '@/components/layout/Header';
import { HeroBanner } from '@/components/features/HeroBanner';
import { CategoryBar } from '@/components/features/CategoryBar';
import { ProductGrid } from '@/components/features/ProductCard';
import { FlashOffer } from '@/components/features/FlashOffer';
import { ClosedNotice } from '@/components/features/ClosedNotice';

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h2 className="font-display text-[20px] font-extrabold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[13.5px] font-bold text-ink-700">
          Barchasi <ArrowRight size={16} className="text-gold-600" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { categories, products } = useMenu();
  const [active, setActive] = useState<string | null>(null);

  const popular = useMemo(() => products.filter((p) => p.is_popular), [products]);
  const activeCategory = categories.find((c) => c.slug === active);
  const filtered = useMemo(
    () => (activeCategory ? products.filter((p) => p.category_id === activeCategory.id) : []),
    [products, activeCategory]
  );

  return (
    <>
      <HomeHeader />

      <div className="px-4">
        <Link
          href="/catalog?search=1"
          className="mb-4 mt-2 flex h-12 items-center gap-3 rounded-2xl bg-white px-4 text-[14.5px] text-ink-400 shadow-card"
        >
          <Search size={19} className="text-ink-500" />
          Taom qidirish...
        </Link>

        <ClosedNotice />
        <HeroBanner />

        <div className="mt-5">
          <CategoryBar categories={categories} active={active} onChange={setActive} />
        </div>

        {activeCategory ? (
          <>
            <SectionTitle title={activeCategory.name} href={`/catalog?c=${activeCategory.slug}`} />
            {filtered.length ? (
              <ProductGrid products={filtered} />
            ) : (
              <p className="py-10 text-center text-ink-500">Bu bo&apos;limda hozircha taom yo&apos;q</p>
            )}
          </>
        ) : (
          <>
            <SectionTitle title="Mashhur taomlar" href="/catalog" />
            <ProductGrid products={popular.length ? popular : products.slice(0, 6)} />

            <div className="mt-6">
              <FlashOffer />
            </div>

            {categories.map((c) => {
              const list = products.filter((p) => p.category_id === c.id);
              if (!list.length) return null;
              return (
                <section key={c.id}>
                  <SectionTitle title={`${c.emoji ? c.emoji + ' ' : ''}${c.name}`} />
                  <ProductGrid products={list} />
                </section>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
