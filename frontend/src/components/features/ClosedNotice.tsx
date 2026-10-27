'use client';

import { CalendarClock, CircleAlert } from 'lucide-react';
import { useMenu } from '@/providers/MenuProvider';
import { useNow } from '@/hooks/useNow';
import { isOpenAt } from '@/lib/time';

/** Yopiq vaqtda yoki buyurtma to'xtatilganda ogohlantirish */
export function ClosedNotice() {
  const { settings } = useMenu();
  const now = useNow();
  if (!now) return null;

  if (!settings.accepting_orders) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-[13.5px] text-rose-800">
        <CircleAlert size={20} className="mt-0.5 shrink-0" />
        <div>
          <b>Hozircha buyurtma qabul qilinmayapti.</b>
          <div className="mt-0.5 text-rose-700">Tez orada qayta ishga tushamiz. Menyuni ko&apos;rib turishingiz mumkin.</div>
        </div>
      </div>
    );
  }

  if (!isOpenAt(now, settings)) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-gold-200/60 p-4 text-[13.5px] text-ink-900">
        <CalendarClock size={20} className="mt-0.5 shrink-0 text-gold-700" />
        <div>
          <b>Hozir yopiqmiz</b> (ish vaqti {settings.open_time}–{settings.close_time}).
          <div className="mt-0.5 text-ink-700">Oldindan buyurtma bering — ochilganimizda birinchi bo&apos;lib tayyorlaymiz.</div>
        </div>
      </div>
    );
  }
  return null;
}
