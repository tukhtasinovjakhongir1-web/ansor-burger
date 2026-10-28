'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { useTelegram } from '@/hooks/useTelegram';
import { ProductGrid } from '@/components/features/ProductCard';
import { cn } from '@/lib/utils';

function normalize(s: string) {
  return s.toLowerCase().replace(/[ʻʼ‘’`']/g, "'").trim();
}

function Catalog() {
  const params = useSearchParams();
  const { categories, products } = useMenu();
  const { haptic } = useTelegram();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(params.get('c') || categories[0]?.slug || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const lockSpy = useRef(false);

  const sections = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, items: products.filter((p) => p.category_id === c.id) }))
        .filter((s) => s.items.length),
    [categories, products]
  );

  const results = useMemo(() => {
    const qn = normalize(query);
    if (!qn) return null;
    return products.filter((p) => normalize(`${p.name} ${p.description}`).includes(qn));
  }, [query, products]);

  const scrollTo = (slug: string, smooth = true) => {
    const el = document.getElementById(`cat-${slug}`);
    if (!el) return;
    lockSpy.current = true;
    setActive(slug);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: smooth ? 'smooth' : 'auto' });
    setTimeout(() => (lockSpy.current = false), 700);
  };

  useEffect(() => {
    if (params.get('search')) inputRef.current?.focus();
    const c = params.get('c');
    if (c) setTimeout(() => scrollTo(c, false), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Qaysi bo'lim ko'rinib turganini kuzatamiz
  useEffect(() => {
    if (results) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (lockSpy.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace('cat-', ''));
      },
      { rootMargin: '-140px 0px -60% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(`cat-${s.category.slug}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, results]);

  useEffect(() => {
    chipsRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  return (
    <>
      <div className="sticky top-0 z-30 bg-cream-100/95 px-4 pb-2 pt-4 backdrop-blur">
        <h1 className="font-display mb-3 text-[22px] font-extrabold tracking-tight">Katalog</h1>
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-card">
          <Search size={19} className="shrink-0 text-ink-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Burger, lavash, kabob..."
            className="h-full flex-1 bg-transparent outline-none placeholder:text-ink-400"
            enterKeyHint="search"
          />
          {query && (
            <button onClick={() => setQuery('')} className="grid h-7 w-7 place-items-center rounded-full bg-cream-200" aria-label="Tozalash">
              <X size={15} />
            </button>
          )}
        </div>
        {!results && (
          <div ref={chipsRef} className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {sections.map(({ category: c }) => (
              <button
                key={c.id}
                data-active={active === c.slug}
                onClick={() => {
                  haptic('select');
                  scrollTo(c.slug);
                }}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition',
                  active === c.slug ? 'bg-gold-gradient text-white shadow-float' : 'bg-white text-ink-700 shadow-sm'
                )}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4">
        {results ? (
          results.length ? (
            <div className="pt-3">
              <p className="mb-3 text-[13px] font-semibold text-ink-500">{results.length} ta natija</p>
              <ProductGrid products={results} />
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="text-5xl">🔍</div>
              <p className="mt-3 font-bold">Hech narsa topilmadi</p>
              <p className="mt-1 text-sm text-ink-500">Boshqa so&apos;z bilan qidirib ko&apos;ring</p>
            </div>
          )
        ) : (
          sections.map(({ category: c, items }) => (
            <section key={c.id} id={`cat-${c.slug}`} className="pt-4">
              <h2 className="font-display mb-3 text-[19px] font-extrabold tracking-tight">
                {c.emoji} {c.name}
              </h2>
              <ProductGrid products={items} />
            </section>
          ))
        )}
      </div>
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  );
}
