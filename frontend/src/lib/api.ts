'use client';

import type { CheckoutInput, Order } from './types';

function initDataHeader(): Record<string, string> {
  const wa = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  return wa?.initData ? { 'x-telegram-init-data': wa.initData } : {};
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...initDataHeader(), ...(init.headers || {}) },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
  return data as T;
}

export const api = {
  createOrder: (input: CheckoutInput) =>
    request<{ order: Order }>('/api/orders', { method: 'POST', body: JSON.stringify(input) }),
  myOrders: (codes: string[]) =>
    request<{ orders: Order[] }>(`/api/orders?codes=${encodeURIComponent(codes.join(','))}`),
  order: (code: string) => request<{ order: Order }>(`/api/orders/${encodeURIComponent(code)}`),
};

/** Admin panel uchun */
export async function adminApi<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Avtorizatsiya kerak');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
  return data as T;
}
