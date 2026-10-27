'use client';

import { Button } from '@/components/ui/Button';

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl">😔</div>
      <h2 className="font-display mt-4 text-xl font-extrabold">Nimadir xato ketdi</h2>
      <p className="mt-2 text-[14px] text-ink-500">Internet aloqasini tekshirib, qaytadan urinib ko&apos;ring</p>
      <Button className="mt-6" onClick={reset}>
        Qayta yuklash
      </Button>
    </div>
  );
}
