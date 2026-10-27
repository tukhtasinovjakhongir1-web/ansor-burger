'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Truck } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useMenu } from '@/providers/MenuProvider';
import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramContext } from '@/providers/TelegramProvider';
import { PageHeader } from '@/components/layout/Header';
import { CartList, CartUpsell } from '@/components/features/CartList';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { ready } = useTelegramContext();
  const { items, unavailable, count, subtotal, clear, remove } = useCart();
  const { settings } = useMenu();
  const { haptic, webApp, isTelegram } = useTelegram();

  const confirmClear = () => {
    const doClear = () => {
      haptic('medium');
      clear();
    };
    if (isTelegram && webApp?.isVersionAtLeast('6.2')) {
      webApp.showConfirm('Savatni tozalaysizmi?', (ok) => ok && doClear());
    } else if (window.confirm('Savatni tozalaysizmi?')) doClear();
  };

  if (!ready) return <PageHeader title="Savat" />;

  if (!items.length && !unavailable.length) {
    return (
      <>
        <PageHeader title="Savat" />
        <div className="flex flex-col items-center px-8 pt-10 text-center">
          <div className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-28 w-28 object-contain" />
          </div>
          <h2 className="font-display mt-6 text-xl font-extrabold">Savatingiz hozircha bo&apos;sh</h2>
          <p className="mt-2 text-[14px] text-ink-500">Mazali taomlarni tanlang — biz tez tayyorlab, yetkazib beramiz</p>
          <Button size="lg" className="mt-6" onClick={() => router.push('/catalog')}>
            Menyuga o&apos;tish <ArrowRight size={18} />
          </Button>
        </div>
      </>
    );
  }

  const freeFrom = settings.free_delivery_from;
  const left = Math.max(0, freeFrom - subtotal);
  const progress = freeFrom > 0 ? Math.min(100, (subtotal / freeFrom) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Savat"
        action={
          items.length > 0 && (
            <button onClick={confirmClear} className="rounded-full px-3 py-2 text-[13px] font-bold text-chili-500">
              Tozalash
            </button>
          )
        }
      />

      <div className="px-4">
        {unavailable.length > 0 && (
          <div className="mb-3 rounded-2xl bg-rose-50 p-3 text-[13px] text-rose-800">
            {unavailable.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-0.5">
                <span>
                  <b>{p.name}</b> hozir mavjud emas
                </span>
                <button onClick={() => remove(p.id)} className="font-bold underline">
                  Olib tashlash
                </button>
              </div>
            ))}
          </div>
        )}

        {freeFrom > 0 && (
          <div className="mb-4 rounded-[20px] bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 text-[13.5px] font-bold">
              <Truck size={18} className="text-gold-600" />
              {left > 0 ? (
                <span>
                  Bepul yetkazishgacha yana <span className="text-gold-700">{formatPrice(left)}</span>
                </span>
              ) : (
                <span className="text-leaf-500">Yetkazib berish bepul! 🎉</span>
              )}
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-cream-200">
              <div className="bg-gold-gradient h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <CartList />
        <CartUpsell />

        <div className="mt-5 rounded-[22px] bg-white p-4 shadow-card">
          <div className="flex justify-between text-[14px] text-ink-700">
            <span>Mahsulotlar ({count} ta)</span>
            <span className="font-bold text-ink-900">{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-1.5 text-[12.5px] text-ink-500">Yetkazib berish narxi keyingi qadamda hududga qarab hisoblanadi</div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-[124px] z-30 mx-auto max-w-md px-4 pb-safe">
          <Button
            size="lg"
            block
            disabled={!settings.accepting_orders}
            onClick={() => {
              haptic('medium');
              router.push('/checkout');
            }}
            className="shadow-float"
          >
            <span className="flex w-full items-center justify-between">
              <span>{settings.accepting_orders ? 'Rasmiylashtirish' : 'Buyurtma qabul qilinmayapti'}</span>
              <span className="flex items-center gap-1.5">
                {formatPrice(subtotal)} <ArrowRight size={18} />
              </span>
            </span>
          </Button>
        </div>
      )}
      <div className="h-24" />
    </>
  );
}
