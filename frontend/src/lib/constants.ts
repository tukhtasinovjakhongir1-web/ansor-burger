import type { OrderStatus, OrderType, PaymentMethod } from './types';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Yangi',
  accepted: 'Qabul qilindi',
  cooking: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  delivering: "Yo'lda",
  done: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
};

export const STATUS_EMOJI: Record<OrderStatus, string> = {
  new: '🆕',
  accepted: '✅',
  cooking: '👨‍🍳',
  ready: '🛍',
  delivering: '🚚',
  done: '🎉',
  cancelled: '❌',
};

/** Tailwind ranglari: badge uchun */
export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  accepted: 'bg-indigo-100 text-indigo-800',
  cooking: 'bg-amber-100 text-amber-800',
  ready: 'bg-teal-100 text-teal-800',
  delivering: 'bg-violet-100 text-violet-800',
  done: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-700',
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  delivery: 'Yetkazib berish',
  pickup: 'Olib ketish',
  dinein: 'Joyida (stol band)',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Naqd pul',
  card: 'Karta orqali',
};

/** Buyurtma turi bo'yicha holatlar ketma-ketligi */
export function statusFlow(type: OrderType): OrderStatus[] {
  return type === 'delivery'
    ? ['new', 'accepted', 'cooking', 'delivering', 'done']
    : ['new', 'accepted', 'cooking', 'ready', 'done'];
}

export function nextStatus(type: OrderType, current: OrderStatus): OrderStatus | null {
  const flow = statusFlow(type);
  const i = flow.indexOf(current);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

export const FINAL_STATUSES: OrderStatus[] = ['done', 'cancelled'];
