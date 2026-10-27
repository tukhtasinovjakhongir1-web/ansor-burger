'use client';

import { create } from 'zustand';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type Toast = { id: number; text: string; kind: 'success' | 'error' };

const useToastStore = create<{ toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void }>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 2600);
  },
}));

export const toast = {
  success: (text: string) => useToastStore.getState().push({ text, kind: 'success' }),
  error: (text: string) => useToastStore.getState().push({ text, kind: 'error' }),
};

export function Toaster({ className }: { className?: string }) {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className={cn('pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4', className)}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-fade flex max-w-sm items-center gap-2 rounded-2xl bg-ink-900/95 px-4 py-3 text-sm font-semibold text-cream-50 shadow-xl"
        >
          {t.kind === 'success' ? (
            <CircleCheck size={18} className="shrink-0 text-gold-300" />
          ) : (
            <TriangleAlert size={18} className="shrink-0 text-rose-300" />
          )}
          {t.text}
        </div>
      ))}
    </div>
  );
}
