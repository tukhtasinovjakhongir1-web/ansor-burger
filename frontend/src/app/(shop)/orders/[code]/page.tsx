'use client';

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarClock, Check, Copy, MapPin, Phone, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { FINAL_STATUSES, ORDER_TYPE_LABEL, PAYMENT_LABEL } from '@/lib/constants';
import { formatDateTime } from '@/lib/time';
import { digits, formatPrice, telLink } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { useMenu } from '@/providers/MenuProvider';
import { useCart } from '@/hooks/useCart';
import { useTelegram } from '@/hooks/useTelegram';
import { PageHeader } from '@/components/layout/Header';
import { OrderStatusTracker, StatusBadge } from '@/components/features/OrderStatusTracker';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

function OrderView({ code }: { code: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const isNew = params.get('new') === '1';
  const { settings } = useMenu();
  const { add } = useCart();
  const { haptic } = useTelegram();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { order } = await api.order(code);
      setOrder(order);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  // Holatni avtomatik yangilab turamiz
  useEffect(() => {
    if (!order || FINAL_STATUSES.includes(order.status)) return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [order, load]);

  if (error) {
    return (
      <>
        <PageHeader title="Buyurtma" />
        <p className="px-4 py-16 text-center text-ink-500">{error}</p>
      </>
    );
  }
  if (!order) {
    return (
      <div className="grid h-[60dvh] place-items-center">
        <Spinner className="h-8 w-8 text-gold-600" />
      </div>
    );
  }

  const repeat = () => {
    order.items.forEach((it) => it.product_id && add(it.product_id, it.qty));
    haptic('success');
    toast.success("Savatga qo'shildi");
    router.push('/cart');
  };

  return (
    <>
      <PageHeader title={`Buyurtma #${order.id}`} action={<StatusBadge status={order.status} />} />
      <div className="space-y-4 px-4">
        {isNew && (
          <div className="rounded-[24px] bg-[linear-gradient(125deg,#ffd6b0,#fff4ea)] p-5 text-center shadow-card">
            <div className="text-4xl">🎉</div>
            <h2 className="font-display mt-2 text-xl font-extrabold">Buyurtmangiz qabul qilindi!</h2>
            <p className="mt-1 text-[13.5px] text-ink-700">
              Operator tez orada tasdiqlaydi. Holatini shu sahifada yoki Telegram botda kuzatishingiz mumkin.
            </p>
          </div>
        )}

        <section className="rounded-[24px] bg-white p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15.5px] font-extrabold">Holati</h2>
            {!FINAL_STATUSES.includes(order.status) && (
              <button onClick={load} className="flex items-center gap-1 text-[12.5px] font-bold text-ink-500">
                <RefreshCw size={14} /> Yangilash
              </button>
            )}
          </div>
          <OrderStatusTracker order={order} />
        </section>

        {order.payment_method === 'card' && order.payment_status !== 'paid' && order.status !== 'cancelled' && (
          <section className="rounded-[24px] bg-[linear-gradient(125deg,#3a2216_0%,#7a3a17_100%)] p-4 text-cream-50 shadow-card">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-gold-300">
              {formatPrice(order.total)} ni shu kartaga o&apos;tkazing
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="font-display whitespace-nowrap text-[17px] font-bold tracking-wide">{settings.card_number}</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(digits(settings.card_number)).catch(() => null);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15"
                aria-label="Nusxa olish"
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <div className="text-[13px] text-cream-300">{settings.card_holder}</div>
            <div className="mt-2 text-[12px] text-cream-200">To&apos;lovdan so&apos;ng chek rasmini Telegram botga yuboring.</div>
          </section>
        )}

        <section className="space-y-2.5 rounded-[24px] bg-white p-4 text-[13.5px] shadow-card">
          <div className="flex justify-between gap-3">
            <span className="text-ink-500">Turi</span>
            <span className="text-right font-bold">{ORDER_TYPE_LABEL[order.order_type]}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-500">Vaqt</span>
            <span className="flex items-center gap-1 text-right font-bold">
              {order.scheduled_at ? (
                <>
                  <CalendarClock size={15} className="text-gold-600" /> {formatDateTime(order.scheduled_at)}
                </>
              ) : (
                'Imkon qadar tez'
              )}
            </span>
          </div>
          {order.order_type === 'delivery' ? (
            <div className="flex justify-between gap-3">
              <span className="text-ink-500">Manzil</span>
              <span className="text-right font-bold">
                {order.address}
                {order.zone_name && <span className="block text-[12px] font-semibold text-ink-500">{order.zone_name}</span>}
              </span>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <span className="text-ink-500">Manzil</span>
              <span className="flex items-center gap-1 text-right font-bold">
                <MapPin size={14} className="text-gold-600" />
                {settings.address}
              </span>
            </div>
          )}
          {order.guests ? (
            <div className="flex justify-between">
              <span className="text-ink-500">Mehmonlar</span>
              <span className="font-bold">{order.guests} kishi</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <span className="text-ink-500">To&apos;lov</span>
            <span className="text-right font-bold">
              {PAYMENT_LABEL[order.payment_method]}
              {order.payment_status === 'paid' && <span className="text-leaf-500"> · to&apos;langan ✓</span>}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-500">Berilgan</span>
            <span className="font-bold">{formatDateTime(order.created_at)}</span>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-4 shadow-card">
          <h2 className="mb-3 text-[15.5px] font-extrabold">Tarkibi</h2>
          <div className="space-y-2.5">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image || '/logo.png'} alt="" className="h-11 w-11 rounded-xl bg-cream-200 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold">{it.name}</div>
                  <div className="text-[12px] text-ink-500">
                    {it.qty} × {formatPrice(it.price)}
                  </div>
                </div>
                <div className="text-[13.5px] font-bold">{formatPrice(it.total)}</div>
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-dashed border-cream-300" />
          <div className="space-y-1 text-[13.5px]">
            <div className="flex justify-between text-ink-700">
              <span>Mahsulotlar</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.order_type === 'delivery' && (
              <div className="flex justify-between text-ink-700">
                <span>Yetkazib berish</span>
                <span>{order.delivery_fee ? formatPrice(order.delivery_fee) : 'Bepul'}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-[16px] font-extrabold">
              <span>Jami</span>
              <span className="text-gold-700">{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {settings.phones[0] && (
            <a
              href={telLink(settings.phones[0])}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cream-300 bg-white text-[15px] font-bold"
            >
              <Phone size={17} /> Qo&apos;ng&apos;iroq
            </a>
          )}
          <Button variant="soft" block onClick={repeat}>
            <RefreshCw size={17} /> Takrorlash
          </Button>
        </div>
      </div>
    </>
  );
}

export default function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <Suspense>
      <OrderView code={code} />
    </Suspense>
  );
}
