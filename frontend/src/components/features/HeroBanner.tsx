'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarClock, Flame, Truck } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { useProfileStore } from '@/store/cartStore';
import { cn, formatPrice } from '@/lib/utils';
import { openProduct } from './ProductSheet';

const AUTOPLAY_MS = 5000;

export function HeroBanner() {
  const router = useRouter();
  const { settings, products } = useMenu();
  const setProfile = useProfileStore((s) => s.update);
  const promo = products.find((p) => p.slug === settings.promo_product);
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const slides = [
    <div key="hero" className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/banners/hero-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,238,222,0.97)_0%,rgba(255,238,222,0.86)_42%,rgba(255,238,222,0)_74%)]" />
      <div className="relative flex h-full max-w-[64%] flex-col justify-center gap-2 pl-5">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-gold-700 shadow-sm">
          <Flame size={13} className="fill-gold-500 text-gold-600" /> Issiq takliflar
        </span>
        <h2 className="font-display text-[23px] font-extrabold leading-[1.08] tracking-tight">
          Mazali turk
          <br />
          taomlari
        </h2>
        <p className="text-[12.5px] font-medium leading-snug text-ink-700">Shahrixon bo&apos;ylab eshigingizgacha yetkazamiz</p>
        <button
          onClick={() => router.push('/catalog')}
          className="bg-gold-gradient mt-1 inline-flex w-fit items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-[13px] font-extrabold text-white shadow-float"
        >
          Buyurtma berish
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-gold-600">
            <ArrowRight size={14} strokeWidth={2.6} />
          </span>
        </button>
      </div>
    </div>,

    <div key="promo" className="relative flex h-full w-full items-center overflow-hidden bg-[linear-gradient(125deg,#ffa24a_0%,#ff7c24_55%,#f2581a_100%)]">
      <span className="absolute -left-12 -top-14 h-44 w-44 rounded-full bg-white/15" />
      <span className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-white/10" />
      <div className="relative z-10 flex max-w-[54%] flex-col gap-2 pl-5">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur">
          ⚡ Aksiya
        </span>
        <h2 className="font-display text-[21px] font-extrabold leading-tight text-white drop-shadow-sm">
          {promo?.name || 'Ansor set'}
        </h2>
        <p className="line-clamp-2 text-[12px] leading-snug text-white/85">{promo?.description || settings.promo_text}</p>
        <div className="flex items-center gap-2">
          <span className="font-display whitespace-nowrap text-[17px] font-extrabold text-white">
            {formatPrice(promo?.price ?? 30000)}
          </span>
          {promo && (
            <button
              onClick={() => openProduct(promo.id)}
              className="rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-gold-700 shadow-sm"
            >
              Qo&apos;shish
            </button>
          )}
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={promo?.image || '/images/sets/ansor-set_thumb.webp'}
        alt=""
        className="absolute -right-3 top-1/2 h-[118%] -translate-y-1/2 rounded-full object-cover shadow-2xl ring-[6px] ring-white/35"
      />
    </div>,

    <div key="preorder" className="relative flex h-full w-full items-center bg-[linear-gradient(120deg,#ffd6b0_0%,#fff4ea_72%)]">
      <div className="relative z-10 flex max-w-[66%] flex-col gap-2 pl-5">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-gold-700 shadow-sm">
          <CalendarClock size={13} /> Oldindan buyurtma
        </span>
        <h2 className="font-display text-[20px] font-extrabold leading-tight">Kelishingizdan oldin buyurtma bering</h2>
        <p className="text-[12px] leading-snug text-ink-700">Kelganingizda taom tayyor bo&apos;ladi — navbat kutmaysiz</p>
        <button
          onClick={() => {
            setProfile({ orderType: 'pickup' });
            router.push('/catalog');
          }}
          className="bg-gold-gradient inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-extrabold text-white shadow-float"
        >
          Vaqtni tanlash <ArrowRight size={14} />
        </button>
      </div>
      <div className="absolute -right-4 bottom-0 top-0 flex items-center">
        <div className="grid h-36 w-36 place-items-center rounded-full bg-white/80 shadow-card ring-8 ring-white/40">
          <Truck size={56} className="text-gold-600" strokeWidth={1.6} />
        </div>
      </div>
    </div>,
  ];

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const t = setInterval(() => {
      if (paused.current) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section>
      <div
        ref={scroller}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => setTimeout(() => (paused.current = false), 4000)}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[28px] shadow-card"
      >
        {slides.map((s, i) => (
          <div key={i} className="h-[176px] w-full shrink-0 snap-center overflow-hidden">
            {s}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`${i + 1}-slayd`}
            onClick={() => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: 'smooth' })}
            className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-gold-600' : 'w-1.5 bg-cream-300')}
          />
        ))}
      </div>
    </section>
  );
}
