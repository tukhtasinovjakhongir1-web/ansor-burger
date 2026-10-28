'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Bell, CalendarClock, ChefHat, Power, Receipt, ShoppingBag, Users, Wallet, type LucideIcon } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { ORDER_TYPE_LABEL } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import type { Order, OrderType, Settings } from '@/lib/types';
import { AdminPageTitle, ORDERS_CHANGED } from '@/components/admin/AdminShell';
import { OrderCard, OrderDrawer } from '@/components/admin/OrderDrawer';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

type Stats = {
  today: { orders: number; revenue: number; cancelled: number; avg_check: number; pending: number; active: number; preorders: number };
  series: { day: string; orders: number; revenue: number }[];
  top: { name: string; qty: number; revenue: number }[];
  byType: { order_type: OrderType; count: number }[];
  customers: number;
};

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

function StatCard({ icon: Icon, label, value, tone, href }: { icon: LucideIcon; label: string; value: string; tone: string; href?: string }) {
  const body = (
    <div className="flex h-full flex-col items-start gap-2 rounded-[22px] bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12', tone)}>
        <Icon size={20} />
      </span>
      <div className="min-w-0 max-w-full">
        <div className="text-[12px] font-semibold leading-tight text-ink-500 sm:text-[12.5px]">{label}</div>
        <div className="font-display truncate text-[18px] font-extrabold sm:text-[21px]">{value}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fresh, setFresh] = useState<Order[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    const [s, st, o] = await Promise.all([
      adminApi<Stats>('/api/admin/stats'),
      adminApi<{ settings: Settings }>('/api/admin/settings'),
      adminApi<{ orders: Order[] }>('/api/admin/orders?status=new&range=all'),
    ]);
    setStats(s);
    setSettings(st.settings);
    setFresh(o.orders);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    window.addEventListener(ORDERS_CHANGED, load);
    return () => {
      clearInterval(t);
      window.removeEventListener(ORDERS_CHANGED, load);
    };
  }, [load]);

  const toggleAccepting = async () => {
    if (!settings) return;
    setToggling(true);
    try {
      const r = await adminApi<{ settings: Settings }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ accepting_orders: !settings.accepting_orders }),
      });
      setSettings(r.settings);
      toast.success(r.settings.accepting_orders ? 'Buyurtmalar qabul qilinmoqda' : "Buyurtma qabul qilish to'xtatildi");
    } finally {
      setToggling(false);
    }
  };

  if (!stats || !settings) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner className="h-8 w-8 text-gold-600" />
      </div>
    );
  }

  const max = Math.max(1, ...stats.series.map((d) => d.revenue));
  const weekRevenue = stats.series.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = stats.series.reduce((s, d) => s + d.orders, 0);
  const opened = fresh.find((o) => o.id === openId) || null;

  return (
    <>
      <AdminPageTitle
        title="Bosh panel"
        subtitle="Bugungi holat — Toshkent vaqti bo'yicha"
        actions={
          <button
            onClick={toggleAccepting}
            disabled={toggling}
            className={cn(
              'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[14px] font-extrabold shadow-card transition',
              settings.accepting_orders ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            )}
          >
            <Power size={18} />
            {settings.accepting_orders ? 'Buyurtma qabul qilinmoqda' : "Buyurtma qabul qilish to'xtatilgan"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Bell} label="Yangi (javob kutmoqda)" value={String(stats.today.pending)} tone="bg-sky-100 text-sky-700" href="/admin/orders?status=new" />
        <StatCard icon={ChefHat} label="Jarayonda" value={String(stats.today.active)} tone="bg-amber-100 text-amber-700" href="/admin/orders?status=active" />
        <StatCard icon={ShoppingBag} label="Bugungi buyurtmalar" value={String(stats.today.orders)} tone="bg-gold-200 text-gold-700" />
        <StatCard icon={Wallet} label="Bugungi tushum" value={formatPrice(stats.today.revenue)} tone="bg-emerald-100 text-emerald-700" />
        <StatCard icon={CalendarClock} label="Oldindan buyurtmalar" value={String(stats.today.preorders)} tone="bg-violet-100 text-violet-700" href="/admin/orders?status=preorder" />
        <StatCard icon={Receipt} label="O'rtacha chek (bugun)" value={formatPrice(stats.today.avg_check)} tone="bg-cream-200 text-ink-700" />
        <StatCard icon={Users} label="Jami mijozlar" value={String(stats.customers)} tone="bg-rose-100 text-rose-700" href="/admin/customers" />
        <StatCard icon={Receipt} label="Bekor qilingan (bugun)" value={String(stats.today.cancelled)} tone="bg-cream-200 text-ink-500" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <section className="rounded-[24px] bg-white p-5 shadow-card xl:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-extrabold">So&apos;nggi 7 kun tushumi</h2>
              <p className="text-[13px] text-ink-500">
                {weekOrders} ta buyurtma · {formatPrice(weekRevenue)}
              </p>
            </div>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3">
            {stats.series.map((d) => {
              const date = new Date(d.day + 'T00:00:00');
              const h = Math.max(4, (d.revenue / max) * 100);
              return (
                <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[11px] font-bold text-ink-500">{d.revenue ? `${Math.round(d.revenue / 1000)}k` : ''}</span>
                  <div className="bg-gold-gradient w-full max-w-[52px] rounded-t-xl" style={{ height: `${h}%` }} title={formatPrice(d.revenue)} />
                  <span className="text-[12px] font-bold text-ink-700">
                    {WEEKDAYS[date.getDay()]} {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 shadow-card">
          <h2 className="text-[16px] font-extrabold">Top taomlar (7 kun)</h2>
          {stats.top.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-ink-500">Hali ma&apos;lumot yo&apos;q</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {stats.top.map((t, i) => (
                <li key={t.name} className="flex items-center gap-3">
                  <span className={cn('grid h-7 w-7 place-items-center rounded-full text-[12px] font-extrabold', i === 0 ? 'bg-gold-gradient text-white' : 'bg-cream-100')}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{t.name}</span>
                  <span className="text-[13px] font-semibold text-ink-500">{t.qty} ta</span>
                </li>
              ))}
            </ol>
          )}
          {stats.byType.length > 0 && (
            <div className="mt-5 border-t border-cream-200 pt-4">
              <h3 className="mb-2 text-[13px] font-bold text-ink-500">Bugun turlar bo&apos;yicha</h3>
              <div className="flex flex-wrap gap-2">
                {stats.byType.map((t) => (
                  <span key={t.order_type} className="rounded-full bg-cream-100 px-3 py-1 text-[12.5px] font-bold">
                    {ORDER_TYPE_LABEL[t.order_type]}: {t.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold">Javob kutayotgan buyurtmalar</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-[13.5px] font-bold text-gold-700">
            Barchasi <ArrowRight size={16} />
          </Link>
        </div>
        {fresh.length === 0 ? (
          <div className="rounded-[22px] bg-white py-10 text-center text-[14px] text-ink-500 shadow-card">Hammasi ko&apos;rib chiqilgan ✨</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {fresh.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={() => setOpenId(o.id)} onChanged={() => load()} />
            ))}
          </div>
        )}
      </section>

      <OrderDrawer
        order={opened}
        onClose={() => setOpenId(null)}
        onChanged={(o) => {
          setFresh((list) => list.map((x) => (x.id === o.id ? o : x)));
          load();
        }}
      />
    </>
  );
}
