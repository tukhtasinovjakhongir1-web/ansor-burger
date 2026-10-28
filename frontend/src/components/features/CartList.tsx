'use client';

import { Plus } from 'lucide-react';
import { useCart, type CartItem } from '@/hooks/useCart';
import { useTelegram } from '@/hooks/useTelegram';
import { useMenu } from '@/providers/MenuProvider';
import { formatPrice } from '@/lib/utils';
import { flyToCart } from '@/lib/flyToCart';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { openProduct } from './ProductSheet';

export function CartRow({ item }: { item: CartItem }) {
  const { setQty } = useCart();
  const { haptic } = useTelegram();
  const p = item.product;
  return (
    <div className="flex gap-3 rounded-[22px] bg-white p-2.5 shadow-card">
      <button onClick={() => openProduct(p.id)} className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-cream-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image || '/logo.png'} alt={p.name} className="h-full w-full object-cover" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="line-clamp-1 text-[15px] font-extrabold">{p.name}</h3>
          <p className="text-[12.5px] font-semibold text-ink-500">{formatPrice(p.price)}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-extrabold text-gold-700">{formatPrice(item.total)}</span>
          <QtyStepper
            size="sm"
            value={item.qty}
            onChange={(v) => {
              haptic('light');
              setQty(p.id, v);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function CartList() {
  const { items } = useCart();
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <CartRow key={it.product.id} item={it} />
      ))}
    </div>
  );
}

/** "Yana nimadir?" — garnir, sous va ichimliklar */
export function CartUpsell() {
  const { products, categories } = useMenu();
  const { qtyOf, add } = useCart();
  const { haptic } = useTelegram();
  const extraCats = categories.filter((c) => ['garnir-sous', 'ichimlik'].includes(c.slug)).map((c) => c.id);
  const list = products.filter((p) => p.category_id && extraCats.includes(p.category_id) && p.is_available && !qtyOf(p.id));
  if (!list.length) return null;

  return (
    <section className="mt-6">
      <h2 className="font-display mb-3 text-[17px] font-extrabold">Yana nimadir qo&apos;shasizmi?</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {list.map((p) => (
          <div key={p.id} data-fly-source className="w-[132px] shrink-0 rounded-[20px] bg-white p-2 shadow-card">
            <button onClick={() => openProduct(p.id)} className="block aspect-square w-full overflow-hidden rounded-2xl bg-cream-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image || '/logo.png'} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
            </button>
            <div className="mt-2 line-clamp-1 px-0.5 text-[13px] font-bold">{p.name}</div>
            <div className="mt-1 flex items-center justify-between px-0.5">
              <span className="text-[13px] font-extrabold text-gold-700">{formatPrice(p.price, false)}</span>
              <button
                onClick={(e) => {
                  haptic('medium');
                  add(p.id);
                  flyToCart(e.currentTarget.closest('[data-fly-source]'));
                }}
                className="bg-gold-gradient grid h-7 w-7 place-items-center rounded-full text-white"
                aria-label={`${p.name} qo'shish`}
              >
                <Plus size={16} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
