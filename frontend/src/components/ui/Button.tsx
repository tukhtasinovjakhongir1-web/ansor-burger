import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

type Variant = 'gold' | 'dark' | 'soft' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  gold: 'bg-gold-gradient text-ink-900 shadow-float hover:brightness-105',
  dark: 'bg-ink-900 text-cream-50 hover:bg-ink-700',
  soft: 'bg-cream-200 text-ink-900 hover:bg-cream-300',
  ghost: 'bg-transparent text-ink-700 hover:bg-cream-200',
  danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  outline: 'border border-cream-300 bg-white text-ink-900 hover:bg-cream-50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'gold', size = 'md', loading, block, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <Spinner className="h-5 w-5" /> : children}
    </button>
  );
});
