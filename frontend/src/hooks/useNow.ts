'use client';

import { useEffect, useState } from 'react';

/** Joriy vaqt (har daqiqada yangilanadi). Serverda null — gidratsiya xatosi bo'lmasligi uchun. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
