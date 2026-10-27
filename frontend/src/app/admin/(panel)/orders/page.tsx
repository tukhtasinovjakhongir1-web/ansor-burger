'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, Search } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { AdminPageTitle, ORDERS_CHANGED } from '@/components/admin/AdminShell';
import { OrderCard, OrderDrawer } from '@/components/admin/OrderDrawer';
import { Spinner } from '@/components/ui/Spinner';

const TABS = [
  { key: 'all', label: 'Hammasi' },
  { key: 'new', label: '🆕 Yangi' },
  { key: 'active', label: '👨‍🍳 Jarayonda' },
  { key: 'preorder', label: '🗓 Oldindan' },
  { key: 'done', label: '🎉 Yakunlangan' },
  { key: 'cancelled', label: '❌ Bekor' },
];

const RANGES = [
  { key: 'today', label: 'Bugun' },
  { key: 'yesterday', label: 'Kecha' },
  { key: 'week', label: '7 kun' },
  { key: 'month', label: '30 kun' },
  { key: 'all', label: 'Hammasi' },
];

function OrdersView() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [range, setRange] = useState('today');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [openId, setOpenId] = useState<number | null>(params.get('id') ? Number(params.get('id')) : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status, range, q: debounced });
      const r = await adminApi<{ orders: Order[]; counts: Record<string, number> }>(`/api/admin/orders?${qs}`);
      setOrders(r.orders);
      setCounts(r.counts);
    } finally {
      setLoading(false);
    }
  }, [status, range, debounced]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    window.addEventListener(ORDERS_CHANGED, load);
    return () => {
      clearInterval(t);
      window.removeEventListener(ORDERS_CHANGED, load);
    };
  }, [load]);

  // Telegram'dagi havola orqali kelganda buyurtmani alohida yuklaymiz
  const [extra, setExtra] = useState<Order | null>(null);
  useEffect(() => {
    if (!openId || orders?.some((o) => o.id === openId)) return;
    adminApi<{ order: Order }>(`/api/admin/orders/${openId}`)
      .then((r) => setExtra(r.order))
      .catch(() => setOpenId(null));
  }, [openId, orders]);

  const onChanged = (o: Order) => {
    setOrders((list) => list?.map((x) => (x.id === o.id ? o : x)) ?? null);
    if (extra?.id === o.id) setExtra(o);
    load();
  };

  const opened = orders?.find((o) => o.id === openId) || (extra?.id === openId ? extra : null);

  return (
    <>
      <AdminPageTitle
        title="Buyurtmalar"
        subtitle="Har 15 soniyada avtomatik yangilanadi"
        actions={
          <button onClick={load} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[13.5px] font-bold shadow-card">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yangilash
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-card">
          <Search size={18} className="text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Raqam, ism, telefon yoki manzil..."
            className="h-full flex-1 bg-transparent text-[14px] outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn('rounded-xl px-3 py-1.5 text-[13px] font-bold', range === r.key ? 'bg-ink-900 text-cream-50' : 'text-ink-700')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-bold transition',
              status === t.key ? 'bg-gold-gradient shadow-float' : 'bg-white text-ink-700 shadow-sm'
            )}
          >
            {t.label}
            <span className={cn('rounded-full px-2 py-0.5 text-[11.5px]', status === t.key ? 'bg-white/70' : 'bg-cream-100')}>
              {counts[t.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {orders === null ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8 text-gold-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-[24px] bg-white py-16 text-center shadow-card">
          <div className="text-5xl">📭</div>
          <p className="mt-3 font-bold">Buyurtmalar yo&apos;q</p>
          <p className="mt-1 text-[13.5px] text-ink-500">Boshqa davr yoki holatni tanlab ko&apos;ring</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onOpen={() => setOpenId(o.id)} onChanged={onChanged} />
          ))}
        </div>
      )}

      <OrderDrawer order={opened} onClose={() => setOpenId(null)} onChanged={onChanged} />
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
