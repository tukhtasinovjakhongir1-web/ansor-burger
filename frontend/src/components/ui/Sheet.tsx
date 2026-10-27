'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  /** Pastdan chiquvchi (mobil) yoki markazdagi oyna */
  variant?: 'bottom' | 'center';
};

export function Sheet({ open, onClose, children, title, className, variant = 'bottom' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 max-h-[92dvh] w-full overflow-y-auto bg-cream-50 shadow-2xl',
          variant === 'bottom'
            ? 'animate-slide-up max-w-md rounded-t-[28px] sm:rounded-[28px]'
            : 'animate-fade max-w-lg rounded-[24px] sm:mx-4',
          className
        )}
      >
        {variant === 'bottom' && <div className="sticky top-0 z-10 mx-auto mt-2 h-1.5 w-10 rounded-full bg-cream-300 sm:hidden" />}
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between bg-cream-50/95 px-5 pb-3 pt-4 backdrop-blur">
            <h3 className="font-display text-lg font-extrabold">{title}</h3>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-cream-200" aria-label="Yopish">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
