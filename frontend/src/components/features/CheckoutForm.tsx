'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  CalendarClock,
  Check,
  Copy,
  CreditCard,
  LocateFixed,
  MapPin,
  ShoppingBag,
  Smartphone,
  Truck,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { useCart } from '@/hooks/useCart';
import { useTelegram } from '@/hooks/useTelegram';
import { useNow } from '@/hooks/useNow';
import { useProfileStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import { buildSlots, isOpenAt } from '@/lib/time';
import { cn, digits, formatPhoneInput, formatPrice, isValidPhone } from '@/lib/utils';
import type { OrderType, PaymentMethod } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

function Card({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-[15.5px] font-extrabold">
        {Icon && <Icon size={18} className="text-gold-600" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition disabled:opacity-40',
        active ? 'border-gold-500 bg-gold-200/40' : 'border-cream-200 bg-cream-50'
      )}
    >
      {active && (
        <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-gold-600 text-white">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      <Icon size={22} className={active ? 'text-gold-700' : 'text-ink-500'} />
      <span className="text-[13px] font-extrabold leading-tight">{title}</span>
      {subtitle && <span className="text-[11px] leading-tight text-ink-500">{subtitle}</span>}
    </button>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { settings, zones } = useMenu();
  const { items, subtotal, count, clear } = useCart();
  const { user, isTelegram, haptic, requestPhone, ready } = useTelegram();
  const profile = useProfileStore();
  const now = useNow(30_000);

  const typeEnabled: Record<OrderType, boolean> = {
    delivery: settings.delivery_enabled,
    pickup: settings.pickup_enabled,
    dinein: settings.dinein_enabled,
  };
  const firstEnabled = (Object.keys(typeEnabled) as OrderType[]).find((t) => typeEnabled[t]) || 'delivery';

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [timeMode, setTimeMode] = useState<'asap' | 'scheduled'>('asap');
  const [slot, setSlot] = useState<string | null>(null);
  const [slotDay, setSlotDay] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [changeFrom, setChangeFrom] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Oldingi ma'lumotlarni to'ldiramiz
  useEffect(() => {
    if (!ready) return;
    const p = useProfileStore.getState();
    setOrderType(typeEnabled[p.orderType] ? p.orderType : firstEnabled);
    setZoneId(p.zoneId && zones.some((z) => z.id === p.zoneId) ? p.zoneId : null);
    setAddress(p.address);
    setLandmark(p.landmark);
    setName(p.name || [user?.first_name, user?.last_name].filter(Boolean).join(' '));
    setPhone(p.phone || '+998');
    const payOk = p.payment === 'card' ? settings.card_enabled : settings.cash_enabled;
    setPayment(payOk ? p.payment : settings.cash_enabled ? 'cash' : 'card');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (ready && !items.length && !submitting) router.replace('/cart');
  }, [ready, items.length, submitting, router]);

  const openNow = now ? isOpenAt(now, settings) : true;
  useEffect(() => {
    if (!openNow) setTimeMode('scheduled');
  }, [openNow]);

  const slots = useMemo(() => (now ? buildSlots(settings, settings.prep_minutes, now) : []), [now, settings]);
  const days = useMemo(() => [...new Set(slots.map((s) => s.day))], [slots]);
  const activeDay = slotDay && days.includes(slotDay) ? slotDay : days[0];

  const zone = zones.find((z) => z.id === zoneId) || null;
  const freeDelivery = settings.free_delivery_from > 0 && subtotal >= settings.free_delivery_from;
  const fee = orderType === 'delivery' && zone ? (freeDelivery ? 0 : zone.fee) : 0;
  const total = subtotal + fee;
  const belowMin = orderType === 'delivery' && zone && subtotal < zone.min_order;
  const eta = orderType === 'delivery' ? zone?.eta_min ?? 40 : settings.prep_minutes;

  const locate = () => {
    if (!navigator.geolocation) return toast.error('Qurilmangiz joylashuvni aniqlay olmaydi');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) });
        setLocating(false);
        haptic('success');
      },
      () => {
        setLocating(false);
        toast.error('Joylashuvni olishga ruxsat berilmadi');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const fillTelegramPhone = async () => {
    const p = await requestPhone();
    if (p) setPhone(formatPhoneInput(p));
    else toast.error('Raqam olinmadi, qo\'lda kiriting');
  };

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(digits(settings.card_number));
      setCopied(true);
      haptic('success');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Nusxa olib bo'lmadi");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Ismingizni kiriting';
    if (!isValidPhone(phone)) e.phone = "Raqamni to'liq kiriting: +998 XX XXX XX XX";
    if (orderType === 'delivery') {
      if (!zone) e.zone = 'Hududni tanlang';
      if (address.trim().length < 3) e.address = 'Manzilni kiriting (mahalla, ko\'cha, uy)';
      if (belowMin) e.zone = `Bu hudud uchun minimal buyurtma: ${formatPrice(zone!.min_order)}`;
    }
    if (timeMode === 'scheduled' && !slot) e.time = 'Vaqtni tanlang';
    if (timeMode === 'asap' && !openNow) e.time = 'Hozir yopiqmiz — vaqt tanlang';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      haptic('error');
      toast.error("Ma'lumotlarni to'ldiring");
      return;
    }
    setSubmitting(true);
    try {
      const { order } = await api.createOrder({
        items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        order_type: orderType,
        customer_name: name.trim(),
        phone,
        zone_id: orderType === 'delivery' ? zoneId : null,
        address,
        landmark,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        scheduled_at: timeMode === 'scheduled' ? slot : null,
        guests: orderType === 'dinein' ? guests : null,
        payment_method: payment,
        change_from: payment === 'cash' && changeFrom ? Number(digits(changeFrom)) : null,
        comment,
      });
      profile.update({ name: name.trim(), phone, zoneId, address, landmark, orderType, payment });
      profile.addOrder(order.code);
      haptic('success');
      router.replace(`/orders/${order.code}?new=1`);
      clear();
    } catch (err) {
      setSubmitting(false);
      haptic('error');
      toast.error(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  if (!ready) return null;
  if (!items.length) {
    return submitting ? (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8 text-gold-600" />
      </div>
    ) : null;
  }

  return (
    <div className="space-y-4 px-4">
      {/* 1. Buyurtma turi */}
      <Card title="Buyurtma turi">
        <div className="grid grid-cols-3 gap-2">
          <Choice
            active={orderType === 'delivery'}
            onClick={() => setOrderType('delivery')}
            disabled={!typeEnabled.delivery}
            icon={Truck}
            title="Yetkazish"
            subtitle="Shahrixon bo'ylab"
          />
          <Choice
            active={orderType === 'pickup'}
            onClick={() => setOrderType('pickup')}
            disabled={!typeEnabled.pickup}
            icon={ShoppingBag}
            title="Olib ketish"
            subtitle="O'zim boraman"
          />
          <Choice
            active={orderType === 'dinein'}
            onClick={() => setOrderType('dinein')}
            disabled={!typeEnabled.dinein}
            icon={UtensilsCrossed}
            title="Joyida"
            subtitle="Stol band qilish"
          />
        </div>
        {orderType !== 'delivery' && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[13px] text-ink-700">
            <MapPin size={17} className="mt-0.5 shrink-0 text-gold-600" />
            <div>
              <b className="text-ink-900">{settings.address}</b>
              <div className="mt-0.5">
                Kelishingizdan oldin buyurtma bering — kelganingizda taom tayyor bo&apos;ladi.
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Vaqt */}
      <Card title={orderType === 'delivery' ? 'Qachon yetkazaylik?' : 'Qachon kelasiz?'} icon={CalendarClock}>
        <div className="grid grid-cols-2 gap-2">
          <Choice
            active={timeMode === 'asap'}
            onClick={() => setTimeMode('asap')}
            disabled={!openNow}
            icon={Zap}
            title="Imkon qadar tez"
            subtitle={openNow ? `~${eta} daqiqa` : 'Hozir yopiq'}
          />
          <Choice
            active={timeMode === 'scheduled'}
            onClick={() => setTimeMode('scheduled')}
            icon={CalendarClock}
            title="Vaqtni tanlash"
            subtitle="Oldindan buyurtma"
          />
        </div>
        {timeMode === 'scheduled' && (
          <div className="mt-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSlotDay(d)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold',
                    d === activeDay ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-700'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="mt-3 grid max-h-52 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {slots
                .filter((s) => s.day === activeDay)
                .map((s) => (
                  <button
                    key={s.iso}
                    type="button"
                    onClick={() => {
                      haptic('select');
                      setSlot(s.iso);
                    }}
                    className={cn(
                      'rounded-xl py-2 text-[13.5px] font-bold tabular-nums transition',
                      slot === s.iso ? 'bg-gold-gradient text-white shadow-float' : 'bg-cream-100 text-ink-700'
                    )}
                  >
                    {s.time}
                  </button>
                ))}
            </div>
          </div>
        )}
        {errors.time && <p className="mt-2 text-xs font-semibold text-chili-500">{errors.time}</p>}
      </Card>

      {/* 3. Manzil yoki mehmonlar */}
      {orderType === 'delivery' && (
        <Card title="Yetkazib berish manzili" icon={MapPin}>
          <div className="space-y-2">
            {zones.map((z) => (
              <button
                type="button"
                key={z.id}
                onClick={() => setZoneId(z.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition',
                  zoneId === z.id ? 'border-gold-500 bg-gold-200/30' : 'border-cream-200'
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                    zoneId === z.id ? 'border-gold-600 bg-gold-600' : 'border-cream-300'
                  )}
                >
                  {zoneId === z.id && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold leading-tight">{z.name}</span>
                  <span className="text-[11.5px] text-ink-500">
                    ~{z.eta_min} daq · min. {formatPrice(z.min_order)}
                  </span>
                </span>
                <span className="whitespace-nowrap text-[13px] font-extrabold text-gold-700">
                  {freeDelivery ? 'Bepul' : formatPrice(z.fee)}
                </span>
              </button>
            ))}
          </div>
          {errors.zone && <p className="mt-2 text-xs font-semibold text-chili-500">{errors.zone}</p>}

          <div className="mt-4 space-y-3">
            <Field label="Manzil" error={errors.address}>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Mahalla, ko'cha, uy raqami" />
            </Field>
            <Field label="Mo'ljal (ixtiyoriy)">
              <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Masalan: maktab yonida, ko'k darvoza" />
            </Field>
            <button
              type="button"
              onClick={locate}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-[14px] font-bold transition',
                coords ? 'border-leaf-500 bg-emerald-50 text-leaf-500' : 'border-cream-300 text-ink-700'
              )}
            >
              {coords ? <Check size={18} /> : <LocateFixed size={18} className={locating ? 'animate-spin' : ''} />}
              {coords ? "Joylashuv qo'shildi" : locating ? 'Aniqlanmoqda...' : 'Joylashuvimni yuborish'}
            </button>
          </div>
        </Card>
      )}

      {orderType === 'dinein' && (
        <Card title="Necha kishi bo'lasiz?" icon={UtensilsCrossed}>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-ink-700">Stol shu songa tayyorlanadi</span>
            <QtyStepper size="md" min={1} value={guests} onChange={(v) => setGuests(Math.min(30, Math.max(1, v)))} />
          </div>
        </Card>
      )}

      {/* 4. Aloqa */}
      <Card title="Aloqa ma'lumotlari" icon={Smartphone}>
        <div className="space-y-3">
          <Field label="Ismingiz" error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism" autoComplete="name" />
          </Field>
          <Field label="Telefon raqam" error={errors.phone}>
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+998 90 123 45 67"
              />
              {isTelegram && (
                <button
                  type="button"
                  onClick={fillTelegramPhone}
                  className="shrink-0 rounded-2xl bg-cream-200 px-3 text-[12.5px] font-bold leading-tight"
                >
                  Telegram
                  <br />
                  raqamim
                </button>
              )}
            </div>
          </Field>
        </div>
      </Card>

      {/* 5. To'lov */}
      <Card title="To'lov usuli" icon={CreditCard}>
        <div className="grid grid-cols-2 gap-2">
          <Choice
            active={payment === 'cash'}
            onClick={() => setPayment('cash')}
            disabled={!settings.cash_enabled}
            icon={Banknote}
            title="Naqd pul"
            subtitle={orderType === 'delivery' ? 'Kuryerga' : 'Kassada'}
          />
          <Choice
            active={payment === 'card'}
            onClick={() => setPayment('card')}
            disabled={!settings.card_enabled}
            icon={CreditCard}
            title="Karta"
            subtitle="Uzcard / Humo"
          />
        </div>
        {payment === 'cash' && (
          <Field label="Qaytim kerakmi? (ixtiyoriy)" className="mt-3" hint="Qaysi kupyuradan to'laysiz — kuryer qaytimni tayyorlab keladi">
            <Input
              value={changeFrom}
              onChange={(e) => setChangeFrom(digits(e.target.value) ? formatPrice(Number(digits(e.target.value)), false) : '')}
              inputMode="numeric"
              placeholder="Masalan: 200 000"
            />
          </Field>
        )}
        {payment === 'card' && (
          <div className="mt-3 rounded-2xl bg-[linear-gradient(125deg,#3a2216_0%,#7a3a17_100%)] p-4 text-cream-50">
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-gold-300">To&apos;lov uchun karta</div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="font-display whitespace-nowrap text-[17px] font-bold tracking-wide tabular-nums">{settings.card_number}</span>
              <button
                type="button"
                onClick={copyCard}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"
                aria-label="Nusxa olish"
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <div className="mt-0.5 text-[13px] text-cream-300">{settings.card_holder}</div>
            <div className="mt-3 rounded-xl bg-white/10 p-2.5 text-[12px] leading-snug text-cream-200">
              Buyurtmadan so&apos;ng <b>{formatPrice(total)}</b> ni shu kartaga o&apos;tkazing va chek rasmini botga yuboring.
              Operator to&apos;lovni tasdiqlaydi.
            </div>
          </div>
        )}
      </Card>

      {/* 6. Izoh */}
      <Card title="Izoh (ixtiyoriy)">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="Masalan: piyozsiz bo'lsin, achchiqroq sous qo'shing"
        />
      </Card>

      {/* 7. Hisob */}
      <section className="rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="mb-3 text-[15.5px] font-extrabold">Buyurtmangiz</h2>
        <div className="space-y-1.5 text-[13.5px]">
          {items.map((i) => (
            <div key={i.product.id} className="flex justify-between gap-3">
              <span className="text-ink-700">
                {i.product.name} <span className="text-ink-400">× {i.qty}</span>
              </span>
              <span className="whitespace-nowrap font-semibold">{formatPrice(i.total)}</span>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-cream-300" />
        <div className="space-y-1.5 text-[14px]">
          <div className="flex justify-between text-ink-700">
            <span>Mahsulotlar ({count} ta)</span>
            <span className="font-semibold text-ink-900">{formatPrice(subtotal)}</span>
          </div>
          {orderType === 'delivery' && (
            <div className="flex justify-between text-ink-700">
              <span>Yetkazib berish</span>
              <span className={cn('font-semibold', fee === 0 && zone ? 'text-leaf-500' : 'text-ink-900')}>
                {!zone ? 'hududni tanlang' : fee === 0 ? 'Bepul' : formatPrice(fee)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-[17px] font-extrabold">
            <span>Jami</span>
            <span className="text-gold-700">{formatPrice(total)}</span>
          </div>
        </div>
      </section>

      <div className="h-24" />
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-cream-100 via-cream-100 to-cream-100/0 px-4 pb-safe pt-6">
        <Button size="lg" block loading={submitting} onClick={submit} className="mb-2">
          <span className="flex w-full items-center justify-between">
            <span>Buyurtma berish</span>
            <span>{formatPrice(total)}</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
