'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { ShoppingBag, X } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { useCart } from '@/hooks/useCart';
import { useTelegram } from '@/hooks/useTelegram';
import { formatPrice, largeImage } from '@/lib/utils';
import { Sheet } from '@/components/ui/Sheet';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { FavoriteButton } from './ProductCard';

const useSheetStore = create<{ id: number | null; set: (id: number | null) => void }>((set) => ({
  id: null,
  set: (id) => set({ id }),
}));

export const openProduct = (id: number) => useSheetStore.getState().set(id);

export function ProductSheet() {
  const id = useSheetStore((s) => s.id);
  const setId = useSheetStore((s) => s.set);
  const { productById, categoryById } = useMenu();
  const { qtyOf, setQty } = useCart();
  const { haptic } = useTelegram();
  const product = id ? productById.get(id) : undefined;
  const inCart = product ? qtyOf(product.id) : 0;
  const [qty, setLocalQty] = useState(1);

  useEffect(() => {
    if (product) setLocalQty(Math.max(1, inCart));
    // faqat yangi mahsulot ochilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const close = () => setId(null);

  return (
    <Sheet open={Boolean(product)} onClose={close}>
      {product && (
        <div className="pb-safe">
          <div className="relative mx-3 mt-3 aspect-[4/3] overflow-hidden rounded-[24px] bg-cream-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={largeImage(product.image)} alt={product.name} className="h-full w-full object-cover" />
            <button
              onClick={close}
              className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>
            <FavoriteButton productId={product.id} className="absolute right-3 top-3 h-9 w-9" />
          </div>

          <div className="px-5 pt-4">
            {product.category_id && categoryById.get(product.category_id) && (
              <div className="text-[12px] font-bold uppercase tracking-wider text-gold-600">
                {categoryById.get(product.category_id)!.name}
              </div>
            )}
            <h2 className="font-display mt-1 text-[22px] font-extrabold leading-tight">{product.name}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-700">{product.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div>
                {product.old_price ? (
                  <div className="text-sm font-semibold text-ink-400 line-through">{formatPrice(product.old_price)}</div>
                ) : null}
                <div className="text-[22px] font-extrabold text-gold-700">{formatPrice(product.price)}</div>
              </div>
              <QtyStepper size="lg" min={1} value={qty} onChange={(v) => setLocalQty(Math.max(1, v))} />
            </div>
          </div>

          <div className="sticky bottom-0 mt-5 bg-cream-50 px-5 pb-4 pt-2">
            <Button
              size="lg"
              block
              disabled={!product.is_available}
              onClick={() => {
                haptic('success');
                setQty(product.id, qty);
                toast.success(inCart ? 'Savat yangilandi' : "Savatga qo'shildi");
                close();
              }}
            >
              {product.is_available ? (
                <>
                  <ShoppingBag size={20} />
                  {inCart ? 'Savatni yangilash' : "Savatga qo'shish"} · {formatPrice(product.price * qty)}
                </>
              ) : (
                'Hozir mavjud emas'
              )}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
