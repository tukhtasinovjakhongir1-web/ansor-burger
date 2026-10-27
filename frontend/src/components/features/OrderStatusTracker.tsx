import { Check } from 'lucide-react';
import { STATUS_EMOJI, STATUS_LABEL, STATUS_STYLE, statusFlow } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold', STATUS_STYLE[status], className)}>
      {STATUS_EMOJI[status]} {STATUS_LABEL[status]}
    </span>
  );
}

export function OrderStatusTracker({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-center text-rose-800">
        <div className="text-3xl">❌</div>
        <div className="mt-1 font-extrabold">Buyurtma bekor qilindi</div>
        {order.cancel_reason && <div className="mt-1 text-[13px]">Sabab: {order.cancel_reason}</div>}
      </div>
    );
  }

  const flow = statusFlow(order.order_type);
  const current = flow.indexOf(order.status);

  return (
    <ol className="relative">
      {flow.map((st, i) => {
        const done = i < current || order.status === 'done';
        const active = i === current && order.status !== 'done';
        return (
          <li key={st} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {i < flow.length - 1 && (
              <span className={cn('absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5', i < current ? 'bg-gold-500' : 'bg-cream-300')} />
            )}
            <span
              className={cn(
                'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px]',
                done ? 'bg-gold-gradient text-ink-900' : active ? 'bg-ink-900 text-white ring-4 ring-gold-300/50' : 'bg-cream-200 text-ink-400'
              )}
            >
              {done ? <Check size={16} strokeWidth={3} /> : <span className={active ? '' : 'opacity-50 grayscale'}>{STATUS_EMOJI[st]}</span>}
            </span>
            <span className={cn('text-[14px]', active ? 'font-extrabold text-ink-900' : done ? 'font-bold text-ink-700' : 'font-semibold text-ink-400')}>
              {STATUS_LABEL[st]}
              {active && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold-500" />}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
