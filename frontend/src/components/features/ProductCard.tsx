'use client';

import { Heart, Plus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useTelegram } from '@/hooks/useTelegram';
import { useFavoritesStore } from '@/store/cartStore';
import { cn, formatPrice } from '@/lib/utils';
import { flyToCart } from '@/lib/flyToCart';
import type { Product } from '@/lib/types';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { openProduct } from './ProductSheet';

export function FavoriteButton({ productId, className }: { productId: number; className?: string }) {
  const isFav = useFavoritesStore((s) => s.ids.includes(productId));
  const toggle = useFavoritesStore((s) => s.toggle);
  const { haptic } = useTelegram();
  return (
    <button
      type="button"
      aria-label={isFav ? 'Sevimlilardan olib tashlash' : "Sevimlilarga qo'shish"}
      onClick={(e) => {
        e.stopPropagation();
        haptic('light');
        toggle(productId);
      }}
      className={cn('grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur transition active:scale-90', className)}
    >
      <Heart
        size={16}
        strokeWidth={2.2}
        className={cn('transition', isFav ? 'fill-chili-500 text-chili-500' : 'text-ink-700')}
      />
    </button>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { qtyOf, add, setQty } = useCart();
  const { haptic } = useTelegram();
  const qty = qtyOf(product.id);
  const soldOut = !product.is_available;

  return (
    <article
      onClick={() => openProduct(product.id)}
      className="group flex cursor-pointer flex-col rounded-[22px] border border-white bg-white p-2 shadow-card transition active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-gradient-to-br from-cream-100 to-cream-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || '/logo.webp'}
          alt={product.name}
          loading="lazy"
          className={cn('h-full w-full object-cover transition duration-300 group-hover:scale-105', soldOut && 'grayscale')}
        />
        <FavoriteButton productId={product.id} className="absolute right-2 top-2" />
        {product.is_popular && !soldOut && (
          <span className="absolute left-2 top-2 bg-gold-gradient rounded-full px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-float">
            🔥 Xit
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-2 bottom-2 rounded-xl bg-ink-900/80 py-1 text-center text-[11px] font-bold text-white">
            Hozir mavjud emas
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
        <h3 className="line-clamp-1 text-[15px] font-extrabold leading-tight">{product.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5em] text-[12px] leading-[1.25] text-ink-500">{product.description}</p>
        {qty > 0 ? (
          <div className="mt-auto pt-2">
            <div className="whitespace-nowrap text-[14px] font-extrabold text-gold-700">{formatPrice(product.price)}</div>
            <QtyStepper
              size="sm"
              className="mt-1.5 w-full justify-between"
              value={qty}
              onChange={(v) => {
                haptic('light');
                setQty(product.id, v);
              }}
            />
          </div>
        ) : (
          <div className="mt-auto flex items-end justify-between gap-1 pt-2">
            <div className="min-w-0">
              {product.old_price ? (
                <div className="text-[11px] font-semibold text-ink-400 line-through">{formatPrice(product.old_price, false)}</div>
              ) : null}
              <div className="whitespace-nowrap text-[15px] font-extrabold text-gold-700">{formatPrice(product.price)}</div>
            </div>
            <button
              type="button"
              disabled={soldOut}
              aria-label={`${product.name} — savatga qo'shish`}
              onClick={(e) => {
                e.stopPropagation();
                haptic('medium');
                add(product.id);
                flyToCart(e.currentTarget.closest('article'));
              }}
              className="bg-gold-gradient grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-float transition active:scale-90 disabled:opacity-40"
            >
              <Plus size={20} strokeWidth={2.6} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
