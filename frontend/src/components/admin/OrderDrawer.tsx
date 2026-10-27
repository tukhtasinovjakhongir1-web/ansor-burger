'use client';

import { useState } from 'react';
import {
  Banknote,
  CalendarClock,
  CreditCard,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  Send,
  Users,
  X,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { ORDER_TYPE_LABEL, STATUS_EMOJI, STATUS_LABEL, nextStatus } from '@/lib/constants';
import { formatDateTime } from '@/lib/time';
import { cn, formatPrice, telLink } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';
import { StatusBadge } from '@/components/features/OrderStatusTracker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

const TYPE_ICON = { delivery: '🚚', pickup: '🛍', dinein: '🍽' } as const;

export async function changeOrder(id: number, patch: { status?: OrderStatus; payment_status?: string; cancel_reason?: string }) {
  const { order } = await adminApi<{ order: Order }>(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return order;
}

/** Buyurtma kartasi (ro'yxat uchun) */
export function OrderCard({ order, onOpen, onChanged }: { order: Order; onOpen: () => void; onChanged: (o: Order) => void }) {
  const [busy, setBusy] = useState(false);
  const next = nextStatus(order.order_type, order.status);

  const advance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!next) return;
    setBusy(true);
    try {
      onChanged(await changeOrder(order.id, { status: next }));
      toast.success(`#${order.id}: ${STATUS_LABEL[next]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      onClick={onOpen}
      className={cn(
        'cursor-pointer rounded-[22px] bg-white p-4 shadow-card transition hover:-translate-y-0.5',
        order.status === 'new' && 'ring-2 ring-sky-300'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-[17px] font-extrabold">#{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-1 text-[12.5px] text-ink-500">{formatDateTime(order.created_at)}</div>
        </div>
        <div className="text-right">
          <div className="text-[16px] font-extrabold text-gold-700">{formatPrice(order.total)}</div>
          <div className="text-[11.5px] font-semibold text-ink-500">
            {order.payment_method === 'card' ? '💳 Karta' : '💵 Naqd'}
            {order.payment_status === 'paid' && <span className="text-leaf-500"> ✓</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] font-bold">
        <span className="rounded-full bg-cream-100 px-2.5 py-1">
          {TYPE_ICON[order.order_type]} {ORDER_TYPE_LABEL[order.order_type]}
        </span>
        {order.scheduled_at && (
          <span className="rounded-full bg-gold-200/70 px-2.5 py-1 text-gold-700">🗓 {formatDateTime(order.scheduled_at)}</span>
        )}
        {order.zone_name && <span className="rounded-full bg-cream-100 px-2.5 py-1">📍 {order.zone_name}</span>}
      </div>

      <div className="mt-3 text-[13px]">
        <div className="font-bold">
          {order.customer_name} · <span className="font-semibold text-ink-700">{order.phone}</span>
        </div>
        <div className="mt-1 line-clamp-2 text-ink-500">{order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</div>
      </div>

      {next && (
        <Button size="sm" block loading={busy} onClick={advance} className="mt-3" variant={order.status === 'new' ? 'gold' : 'soft'}>
          {STATUS_EMOJI[next]} {order.status === 'new' ? 'Qabul qilish' : STATUS_LABEL[next]}
        </Button>
      )}
    </article>
  );
}

/** To'liq ma'lumot oynasi */
export function OrderDrawer({ order, onClose, onChanged }: { order: Order | null; onClose: () => void; onChanged: (o: Order) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelMode, setCancelMode] = useState(false);
  const [reason, setReason] = useState('');

  if (!order) return null;
  const next = nextStatus(order.order_type, order.status);
  const final = order.status === 'done' || order.status === 'cancelled';

  const run = async (key: string, patch: Parameters<typeof changeOrder>[1]) => {
    setBusy(key);
    try {
      const o = await changeOrder(order.id, patch);
      onChanged(o);
      toast.success('Saqlandi');
      setCancelMode(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="no-print animate-fade absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <aside className="print-area relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-cream-50 shadow-2xl">
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-cream-200 bg-cream-50/95 px-5 py-4 backdrop-blur">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-extrabold">Buyurtma #{order.id}</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="text-[12.5px] text-ink-500">
              {formatDateTime(order.created_at)} · kod {order.code}
            </div>
          </div>
          <button onClick={() => window.print()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Chop etish">
            <Printer size={18} />
          </button>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Yopish">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-5">
          {/* Chek (chop etish uchun ham) */}
          <div className="hidden text-center print:block">
            <div className="text-xl font-extrabold">ANSOR BURGER</div>
            <div>Buyurtma #{order.id} · {formatDateTime(order.created_at)}</div>
          </div>

          <section className="space-y-2.5 rounded-[20px] bg-white p-4 text-[14px] shadow-card">
            <div className="flex items-center gap-2 font-bold">
              {TYPE_ICON[order.order_type]} {ORDER_TYPE_LABEL[order.order_type]}
              {order.guests ? (
                <span className="flex items-center gap-1 text-ink-500">
                  · <Users size={14} /> {order.guests} kishi
                </span>
              ) : null}
            </div>
            <div className={cn('flex items-center gap-2', order.scheduled_at && 'font-extrabold text-gold-700')}>
              <CalendarClock size={16} />
              {order.scheduled_at ? `Oldindan: ${formatDateTime(order.scheduled_at)}` : 'Imkon qadar tez'}
            </div>
            <div className="border-t border-cream-200 pt-2.5">
              <div className="font-bold">{order.customer_name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <a href={telLink(order.phone)} className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 text-[13px] font-bold">
                  <Phone size={14} /> {order.phone}
                </a>
                {order.username && (
                  <a
                    href={`https://t.me/${order.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-[13px] font-bold text-sky-700"
                  >
                    <Send size={14} /> @{order.username}
                  </a>
                )}
              </div>
            </div>
            {order.order_type === 'delivery' && (
              <div className="border-t border-cream-200 pt-2.5">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-gold-600" />
                  <div>
                    <div className="font-bold">{order.address}</div>
                    {order.zone_name && <div className="text-[12.5px] text-ink-500">{order.zone_name}</div>}
                    {order.landmark && <div className="text-[13px] text-ink-700">Mo&apos;ljal: {order.landmark}</div>}
                  </div>
                </div>
                {order.lat && order.lng && (
                  <div className="no-print mt-2 flex gap-2">
                    <a
                      href={`https://yandex.uz/maps/?pt=${order.lng},${order.lat}&z=17&l=map`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-[12.5px] font-bold"
                    >
                      <ExternalLink size={13} /> Yandex xarita
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${order.lat},${order.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-[12.5px] font-bold"
                    >
                      <ExternalLink size={13} /> Google xarita
                    </a>
                  </div>
                )}
              </div>
            )}
            {order.comment && (
              <div className="flex items-start gap-2 rounded-xl bg-gold-200/40 p-2.5 text-[13.5px]">
                <MessageSquare size={16} className="mt-0.5 shrink-0 text-gold-700" /> {order.comment}
              </div>
            )}
          </section>

          <section className="rounded-[20px] bg-white p-4 shadow-card">
            <div className="space-y-2 text-[14px]">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between gap-3">
                  <span>
                    <b>{it.qty} ×</b> {it.name}
                  </span>
                  <span className="whitespace-nowrap font-semibold">{formatPrice(it.total)}</span>
                </div>
              ))}
            </div>
            <div className="my-3 border-t border-dashed border-cream-300" />
            <div className="space-y-1 text-[14px]">
              <div className="flex justify-between text-ink-700">
                <span>Mahsulotlar</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.order_type === 'delivery' && (
                <div className="flex justify-between text-ink-700">
                  <span>Yetkazib berish</span>
                  <span>{order.delivery_fee ? formatPrice(order.delivery_fee) : 'bepul'}</span>
                </div>
              )}
              <div className="flex justify-between text-[17px] font-extrabold">
                <span>Jami</span>
                <span className="text-gold-700">{formatPrice(order.total)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-cream-100 px-3 py-2.5 text-[13.5px]">
              <span className="flex items-center gap-2 font-bold">
                {order.payment_method === 'card' ? <CreditCard size={16} /> : <Banknote size={16} />}
                {order.payment_method === 'card' ? 'Karta' : 'Naqd'}
                {order.change_from ? <span className="font-semibold text-ink-500">· {formatPrice(order.change_from)} dan qaytim</span> : null}
              </span>
              <span className={cn('font-extrabold', order.payment_status === 'paid' ? 'text-leaf-500' : 'text-chili-500')}>
                {order.payment_status === 'paid' ? "To'langan" : "To'lanmagan"}
              </span>
            </div>
          </section>

          {order.status === 'cancelled' && order.cancel_reason && (
            <div className="rounded-2xl bg-rose-50 p-3 text-[13.5px] text-rose-800">Bekor qilish sababi: {order.cancel_reason}</div>
          )}
        </div>

        {/* Amallar */}
        <div className="no-print sticky bottom-0 space-y-2 border-t border-cream-200 bg-cream-50 p-4">
          {cancelMode ? (
            <div className="space-y-2">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sabab (mijozga yuboriladi)" autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="soft" onClick={() => setCancelMode(false)}>
                  Orqaga
                </Button>
                <Button variant="danger" loading={busy === 'cancel'} onClick={() => run('cancel', { status: 'cancelled', cancel_reason: reason })}>
                  Bekor qilish
                </Button>
              </div>
            </div>
          ) : (
            <>
              {next && (
                <Button size="lg" block loading={busy === 'next'} onClick={() => run('next', { status: next })}>
                  {STATUS_EMOJI[next]} {order.status === 'new' ? 'Qabul qilish' : STATUS_LABEL[next]}
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={order.payment_status === 'paid' ? 'soft' : 'outline'}
                  loading={busy === 'pay'}
                  onClick={() => run('pay', { payment_status: order.payment_status === 'paid' ? 'unpaid' : 'paid' })}
                >
                  {order.payment_status === 'paid' ? "To'lanmagan qilish" : "💰 To'landi"}
                </Button>
                {!final ? (
                  <Button variant="danger" onClick={() => setCancelMode(true)}>
                    ❌ Bekor qilish
                  </Button>
                ) : (
                  <select
                    value=""
                    onChange={(e) => e.target.value && run('status', { status: e.target.value as OrderStatus })}
                    className="h-11 rounded-2xl border border-cream-300 bg-white px-3 text-[14px] font-bold"
                  >
                    <option value="">Holatni o&apos;zgartirish</option>
                    {(Object.keys(STATUS_LABEL) as OrderStatus[])
                      .filter((s) => s !== order.status)
                      .map((s) => (
                        <option key={s} value={s}>
                          {STATUS_EMOJI[s]} {STATUS_LABEL[s]}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
