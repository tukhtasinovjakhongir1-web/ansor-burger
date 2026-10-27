'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  min?: number;
  className?: string;
};

export function QtyStepper({ value, onChange, size = 'md', min = 0, className }: Props) {
  const dims = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-12 w-12' }[size];
  const text = { sm: 'w-6 text-sm', md: 'w-8 text-base', lg: 'w-10 text-lg' }[size];
  const icon = size === 'lg' ? 20 : 16;
  const showTrash = min === 0 && value <= 1;
  return (
    <div className={cn('inline-flex items-center rounded-full bg-cream-200 p-0.5', className)}>
      <button
        type="button"
        aria-label="Kamaytirish"
        disabled={value <= min}
        onClick={(e) => {
          e.stopPropagation();
          onChange(value - 1);
        }}
        className={cn(dims, 'grid place-items-center rounded-full bg-white text-ink-900 shadow-sm transition active:scale-90 disabled:opacity-40')}
      >
        {showTrash ? <Trash2 size={icon - 2} className="text-chili-500" /> : <Minus size={icon} strokeWidth={2.5} />}
      </button>
      <span className={cn(text, 'text-center font-extrabold tabular-nums')}>{value}</span>
      <button
        type="button"
        aria-label="Ko'paytirish"
        onClick={(e) => {
          e.stopPropagation();
          onChange(value + 1);
        }}
        className={cn(dims, 'bg-gold-gradient grid place-items-center rounded-full text-ink-900 shadow-sm transition active:scale-90')}
      >
        <Plus size={icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
