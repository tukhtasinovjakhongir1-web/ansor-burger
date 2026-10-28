'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, House, LayoutGrid, ShoppingBag, User, type LucideIcon } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: LucideIcon };

const LEFT: Item[] = [
  { href: '/', label: 'Asosiy', icon: House },
  { href: '/catalog', label: 'Katalog', icon: LayoutGrid },
];
const RIGHT: Item[] = [
  { href: '/favorites', label: 'Sevimli', icon: Heart },
  { href: '/profile', label: 'Profil', icon: User },
];

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const { haptic } = useTelegram();
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={() => haptic('select')}
      className="flex flex-col items-center gap-1 py-1"
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-8 w-14 place-items-center rounded-full transition-colors',
          active ? 'bg-gold-200/80 text-gold-700' : 'text-ink-400'
        )}
      >
        <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
      </span>
      <span className={cn('text-[11.5px] leading-none', active ? 'font-extrabold text-gold-700' : 'font-semibold text-ink-400')}>
        {item.label}
      </span>
    </Link>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  const { count } = useCart();
  const { haptic } = useTelegram();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const cartActive = pathname.startsWith('/cart');

  return (
    <nav className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-safe">
      <div className="pointer-events-auto relative rounded-[26px] border border-white bg-white/90 px-1 pb-1.5 pt-1.5 shadow-bar backdrop-blur-md">
        <div className="grid grid-cols-5 items-end">
          {LEFT.map((it) => (
            <NavItem key={it.href} item={it} active={isActive(it.href)} />
          ))}

          {/* Markazdagi savat tugmasi */}
          <div className="relative flex justify-center">
            <Link
              href="/cart"
              onClick={() => haptic('medium')}
              aria-label={`Savat${count ? `: ${count} ta mahsulot` : ''}`}
              className={cn(
                'bg-gold-gradient absolute -top-[46px] grid h-[66px] w-[66px] place-items-center rounded-full shadow-float ring-[5px] ring-cream-100 transition active:scale-95',
                cartActive && 'ring-gold-200'
              )}
            >
              <ShoppingBag size={27} strokeWidth={2.2} className="text-white" />
              {count > 0 && (
                <span
                  key={count}
                  className="animate-pop absolute -right-0.5 -top-0.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-ink-900 px-1 text-[11px] font-extrabold text-white ring-2 ring-white"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
            <span className="h-[46px]" />
          </div>

          {RIGHT.map((it) => (
            <NavItem key={it.href} item={it} active={isActive(it.href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}
