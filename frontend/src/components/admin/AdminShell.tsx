'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPinned,
  Settings,
  UtensilsCrossed,
  Users,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Toaster, toast } from '@/components/ui/Toast';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Bosh panel', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Buyurtmalar', icon: ClipboardList },
  { href: '/admin/products', label: 'Mahsulotlar', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Kategoriyalar', icon: LayoutGrid },
  { href: '/admin/zones', label: 'Hududlar', icon: MapPinned },
  { href: '/admin/customers', label: 'Mijozlar', icon: Users },
  { href: '/admin/settings', label: 'Sozlamalar', icon: Settings },
];

export const ORDERS_CHANGED = 'ab:orders-changed';

let audioCtx: AudioContext | null = null;
function beep() {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    [0, 0.22, 0.44].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1175 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.22);
    });
  } catch {
    /* ovoz qo'llab-quvvatlanmaydi */
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(0);
  const [sound, setSound] = useState(true);
  const lastId = useRef<number | null>(null);

  useEffect(() => {
    try {
      setSound(localStorage.getItem('ab-admin-sound') !== 'off');
    } catch {}
    // Brauzer ovozni faqat foydalanuvchi bosgandan keyin ruxsat beradi
    const unlock = () => {
      audioCtx ??= new AudioContext();
      audioCtx.resume().catch(() => null);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => null);
    }
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // Yangi buyurtmalarni kuzatib turamiz
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await adminApi<{ latest_id: number; pending: number }>('/api/admin/orders?poll=1');
        if (!alive) return;
        setPending(r.pending);
        if (lastId.current !== null && r.latest_id > lastId.current) {
          toast.success(`Yangi buyurtma #${r.latest_id}!`);
          if (localStorage.getItem('ab-admin-sound') !== 'off') beep();
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('Ansor Burger — yangi buyurtma', { body: `Buyurtma #${r.latest_id}`, icon: '/icon-192.png' });
          }
          window.dispatchEvent(new Event(ORDERS_CHANGED));
        }
        lastId.current = r.latest_id;
      } catch {
        /* tarmoq xatosi — keyingi safar */
      }
    };
    poll();
    const t = setInterval(poll, 7000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    document.title = pending > 0 ? `(${pending}) Admin — Ansor Burger` : 'Admin — Ansor Burger';
  }, [pending]);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem('ab-admin-sound', next ? 'on' : 'off');
    } catch {}
    if (next) beep();
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="bg-app min-h-dvh lg:flex">
      {/* Yon panel (kompyuter) */}
      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-cream-200 bg-white px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-white shadow-float ring-2 ring-gold-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="font-display font-extrabold leading-tight">Ansor Burger</div>
            <div className="text-[12px] font-semibold text-ink-500">Admin panel</div>
          </div>
        </div>
        <nav className="mt-7 flex-1 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14.5px] font-bold transition',
                isActive(n.href) ? 'bg-gold-gradient text-white shadow-float' : 'text-ink-700 hover:bg-cream-100'
              )}
            >
              <n.icon size={19} />
              <span className="flex-1">{n.label}</span>
              {n.href === '/admin/orders' && pending > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-chili-500 px-1.5 text-[11.5px] font-extrabold text-white">
                  {pending}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-cream-200 pt-3">
          <button onClick={toggleSound} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold text-ink-700 hover:bg-cream-100">
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />} Ovozli signal: {sound ? 'yoqiq' : "o'chiq"}
          </button>
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold text-ink-700 hover:bg-cream-100">
            <ExternalLink size={19} /> Mini Appni ochish
          </a>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold text-chili-500 hover:bg-rose-50">
            <LogOut size={19} /> Chiqish
          </button>
        </div>
      </aside>

      {/* Mobil yuqori panel */}
      <div className="no-print sticky top-0 z-40 border-b border-cream-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-white shadow-float ring-2 ring-gold-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="font-display flex-1 font-extrabold">Admin panel</div>
          <button onClick={toggleSound} className="grid h-9 w-9 place-items-center rounded-full bg-cream-100" aria-label="Ovoz">
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-full bg-rose-50 text-chili-500" aria-label="Chiqish">
            <LogOut size={18} />
          </button>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold',
                isActive(n.href) ? 'bg-gold-gradient text-white shadow-float' : 'bg-cream-100 text-ink-700'
              )}
            >
              <n.icon size={15} />
              {n.label}
              {n.href === '/admin/orders' && pending > 0 && (
                <span className="rounded-full bg-chili-500 px-1.5 text-[11px] text-white">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-7">{children}</main>
      <Toaster />
    </div>
  );
}

export function AdminPageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[24px] font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
