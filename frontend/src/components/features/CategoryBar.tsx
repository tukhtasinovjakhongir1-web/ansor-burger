'use client';

import { useEffect, useRef } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

type Props = {
  categories: Category[];
  active: string | null;
  onChange: (slug: string | null) => void;
  showAll?: boolean;
};

const ALL_IMAGE = '/images/products/dabl-chizburger_thumb.webp';

export function CategoryBar({ categories, active, onChange, showAll = true }: Props) {
  const { haptic } = useTelegram();
  const scroller = useRef<HTMLDivElement>(null);

  // Tanlangan kategoriyani ko'rinadigan joyga suramiz
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  const items = [
    ...(showAll ? [{ slug: null as string | null, name: 'Hammasi', image: ALL_IMAGE }] : []),
    ...categories.map((c) => ({ slug: c.slug as string | null, name: c.name, image: c.image })),
  ];

  return (
    <div className="rounded-[26px] bg-white py-3 shadow-card">
      <div ref={scroller} className="no-scrollbar flex gap-1 overflow-x-auto px-2">
        {items.map((c) => {
          const isActive = c.slug === active;
          return (
            <button
              key={c.slug ?? 'all'}
              data-active={isActive}
              onClick={() => {
                haptic('select');
                onChange(c.slug);
              }}
              className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'grid h-[62px] w-[62px] place-items-center rounded-full p-[3px] transition',
                  isActive ? 'bg-gold-gradient shadow-float' : 'bg-cream-100'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image || '/logo.png'}
                  alt=""
                  loading="lazy"
                  className={cn('h-full w-full rounded-full object-cover', isActive && 'ring-2 ring-white')}
                />
              </span>
              <span
                className={cn(
                  'line-clamp-2 text-center text-[11.5px] leading-tight',
                  isActive ? 'font-extrabold text-ink-900' : 'font-semibold text-ink-500'
                )}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
