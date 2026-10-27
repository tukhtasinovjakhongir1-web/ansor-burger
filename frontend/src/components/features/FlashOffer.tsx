'use client';

import { ChevronRight, Zap } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { openProduct } from './ProductSheet';

export function FlashOffer() {
  const { settings, products } = useMenu();
  const product = products.find((p) => p.slug === settings.promo_product);
  if (!settings.promo_title) return null;

  return (
    <button
      onClick={() => product && openProduct(product.id)}
      className="relative flex w-full items-center overflow-hidden rounded-[26px] bg-[linear-gradient(110deg,#f6e3ae_0%,#fbecc6_55%,#f5ebd7_100%)] p-5 text-left shadow-card"
    >
      <div className="relative z-10 max-w-[58%]">
        <div className="flex items-center gap-1 text-[12px] font-extrabold text-gold-700">
          <Zap size={14} className="fill-gold-500 text-gold-600" /> Aksiya
        </div>
        <div className="font-display mt-1 text-[19px] font-extrabold leading-tight">{settings.promo_title}</div>
        {settings.promo_text && <div className="mt-1 text-[12px] leading-snug text-ink-700">{settings.promo_text}</div>}
      </div>
      {product?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image}
          alt=""
          className="absolute right-12 top-1/2 h-[110px] w-[110px] -translate-y-1/2 rounded-full object-cover shadow-xl ring-4 ring-white/70"
        />
      )}
      <span className="bg-gold-gradient absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full shadow-float">
        <ChevronRight size={22} strokeWidth={2.6} />
      </span>
    </button>
  );
}
