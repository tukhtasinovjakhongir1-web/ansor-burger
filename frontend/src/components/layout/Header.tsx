'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMenu } from '@/providers/MenuProvider';
import { useTelegram } from '@/hooks/useTelegram';
import { openStatus } from '@/lib/time';
import { cn, telLink } from '@/lib/utils';
import { useNow } from '@/hooks/useNow';

export function HomeHeader() {
  const { settings } = useMenu();
  const now = useNow();
  const status = now ? openStatus(settings, now) : null;
  return (
    <header className="flex items-center gap-3 px-4 pb-2 pt-4">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white shadow-float ring-2 ring-white">
        <Image src="/logo.webp" alt={settings.restaurant_name} fill sizes="48px" className="object-cover p-0.5" priority />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[19px] font-extrabold leading-tight tracking-tight">{settings.restaurant_name}</h1>
        <div className="mt-1 flex items-center gap-2 text-[12px] font-semibold text-ink-500">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <MapPin size={13} className="shrink-0 text-gold-600" />
            Shahrixon
          </span>
          {status && (
            <span
              className={cn(
                'flex items-center gap-1 truncate rounded-full px-2 py-0.5',
                status.open ? 'bg-emerald-50 text-leaf-500' : 'bg-rose-50 text-chili-500'
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status.open ? 'bg-leaf-500' : 'bg-chili-500')} />
              <span className="truncate">{status.label}</span>
            </span>
          )}
        </div>
      </div>
      {settings.phones[0] && (
        <a
          href={telLink(settings.phones[0])}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink-900 shadow-card"
          aria-label="Qo'ng'iroq qilish"
        >
          <Phone size={19} />
        </a>
      )}
    </header>
  );
}

export function PageHeader({ title, action, back = true }: { title: string; action?: ReactNode; back?: boolean }) {
  const router = useRouter();
  const { isTelegram } = useTelegram();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-cream-100/75 px-4 pb-3 pt-4 backdrop-blur-md">
      {back && !isTelegram && (
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card"
          aria-label="Orqaga"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <h1 className="font-display flex-1 text-[22px] font-extrabold tracking-tight">{title}</h1>
      {action}
    </header>
  );
}
