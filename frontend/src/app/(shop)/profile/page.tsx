'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Clock, Instagram, MapPin, Package, Phone, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/time';
import { formatPrice, telLink } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { useMenu } from '@/providers/MenuProvider';
import { useTelegram } from '@/hooks/useTelegram';
import { useProfileStore } from '@/store/cartStore';
import { PageHeader } from '@/components/layout/Header';
import { StatusBadge } from '@/components/features/OrderStatusTracker';
import { Spinner } from '@/components/ui/Spinner';

const BOT = process.env.NEXT_PUBLIC_BOT_USERNAME;

export default function ProfilePage() {
  const { settings } = useMenu();
  const { user, isTelegram, ready, openLink } = useTelegram();
  const profile = useProfileStore();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    const codes = useProfileStore.getState().orderCodes;
    if (!isTelegram && !codes.length) return setOrders([]);
    api
      .myOrders(codes)
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, [ready, isTelegram]);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || profile.name || 'Mehmon';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <>
      <PageHeader title="Profil" back={false} />
      <div className="space-y-4 px-4">
        <section className="flex items-center gap-4 rounded-[24px] bg-[linear-gradient(120deg,#2a2117,#4a3d2e)] p-5 text-cream-50 shadow-card">
          {user?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photo_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-gold-300" />
          ) : (
            <div className="bg-gold-gradient grid h-16 w-16 place-items-center rounded-full text-2xl font-extrabold text-ink-900">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-display truncate text-lg font-extrabold">{displayName}</div>
            {user?.username && <div className="text-[13px] text-cream-300">@{user.username}</div>}
            {profile.phone && profile.phone.length > 5 && <div className="text-[13px] text-cream-300">{profile.phone}</div>}
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-[15.5px] font-extrabold">
            <Package size={18} className="text-gold-600" /> Buyurtmalarim
          </h2>
          {orders === null ? (
            <div className="grid place-items-center py-6">
              <Spinner className="h-6 w-6 text-gold-600" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-4 text-center text-[13.5px] text-ink-500">Hali buyurtma bermagansiz</p>
          ) : (
            <div className="-mx-1 divide-y divide-cream-200">
              {orders.map((o) => (
                <Link key={o.id} href={`/orders/${o.code}`} className="flex items-center gap-3 px-1 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-extrabold">#{o.id}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-1 truncate text-[12.5px] text-ink-500">
                      {formatDateTime(o.created_at)} · {o.items.map((i) => i.name).join(', ')}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[14px] font-extrabold text-gold-700">{formatPrice(o.total)}</span>
                  <ChevronRight size={18} className="text-ink-400" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="divide-y divide-cream-200 rounded-[24px] bg-white px-4 shadow-card">
          <div className="flex items-start gap-3 py-3.5">
            <MapPin size={19} className="mt-0.5 shrink-0 text-gold-600" />
            <div>
              <div className="text-[14px] font-bold">{settings.address}</div>
              <div className="text-[12.5px] text-ink-500">Andijon viloyati, Shahrixon tumani</div>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3.5">
            <Clock size={19} className="mt-0.5 shrink-0 text-gold-600" />
            <div>
              <div className="text-[14px] font-bold">
                Har kuni {settings.open_time} – {settings.close_time}
              </div>
              <div className="text-[12.5px] text-ink-500">Yetkazib berish va oldindan buyurtma</div>
            </div>
          </div>
          {settings.phones.map((p) => (
            <a key={p} href={telLink(p)} className="flex items-center gap-3 py-3.5">
              <Phone size={19} className="shrink-0 text-gold-600" />
              <span className="flex-1 text-[14px] font-bold">{p}</span>
              <ChevronRight size={18} className="text-ink-400" />
            </a>
          ))}
          {settings.instagram && (
            <button
              onClick={() => openLink(`https://www.instagram.com/${settings.instagram}/`)}
              className="flex w-full items-center gap-3 py-3.5 text-left"
            >
              <Instagram size={19} className="shrink-0 text-gold-600" />
              <span className="flex-1 text-[14px] font-bold">@{settings.instagram}</span>
              <ChevronRight size={18} className="text-ink-400" />
            </button>
          )}
          {BOT && !isTelegram && (
            <a href={`https://t.me/${BOT}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3.5">
              <Send size={19} className="shrink-0 text-gold-600" />
              <span className="flex-1 text-[14px] font-bold">Telegram bot: @{BOT}</span>
              <ChevronRight size={18} className="text-ink-400" />
            </a>
          )}
        </section>

        <p className="pb-2 text-center text-[11.5px] text-ink-400">© {settings.restaurant_name} · {settings.tagline}</p>
      </div>
    </>
  );
}
