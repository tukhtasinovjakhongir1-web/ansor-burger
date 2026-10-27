/**
 * Vaqt bilan ishlash. O'zbekiston: UTC+5, yozgi vaqt yo'q.
 * Server ham, mijoz ham shu funksiyalardan foydalanadi — natija bir xil bo'ladi.
 */
const OFFSET_MS = 5 * 60 * 60 * 1000;
const SLOT_MINUTES = 15;

type Hours = { open_time: string; close_time: string };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Toshkent vaqti bo'yicha kun ichidagi daqiqa (0..1439) */
export function minutesOfDay(date: Date) {
  const t = new Date(date.getTime() + OFFSET_MS);
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

function dayIndex(date: Date) {
  return Math.floor((date.getTime() + OFFSET_MS) / 86_400_000);
}

export function isOpenAt(date: Date, hours: Hours) {
  const m = minutesOfDay(date);
  const open = toMinutes(hours.open_time);
  const close = toMinutes(hours.close_time);
  if (open === close) return true; // 24 soat
  return close > open ? m >= open && m < close : m >= open || m < close;
}

export function formatTime(date: Date | string) {
  const t = new Date(new Date(date).getTime() + OFFSET_MS);
  return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];

export function formatDay(date: Date | string, now = new Date()) {
  const d = new Date(date);
  const diff = dayIndex(d) - dayIndex(now);
  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Ertaga';
  if (diff === -1) return 'Kecha';
  const t = new Date(d.getTime() + OFFSET_MS);
  return `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}`;
}

export function formatDateTime(date: Date | string, now = new Date()) {
  return `${formatDay(date, now)}, ${formatTime(date)}`;
}

export type Slot = { iso: string; day: string; time: string };

/** Oldindan buyurtma uchun vaqt oraliqlari (15 daqiqalik), ish vaqti ichida, 2 kungacha */
export function buildSlots(hours: Hours, prepMinutes: number, now = new Date(), limit = 80): Slot[] {
  const step = SLOT_MINUTES * 60_000;
  const earliest = now.getTime() + Math.max(prepMinutes, 15) * 60_000;
  let t = Math.ceil(earliest / step) * step;
  const end = now.getTime() + 2 * 86_400_000;
  const slots: Slot[] = [];
  while (t <= end && slots.length < limit) {
    const d = new Date(t);
    if (isOpenAt(d, hours)) {
      slots.push({ iso: d.toISOString(), day: formatDay(d, now), time: formatTime(d) });
    }
    t += step;
  }
  return slots;
}

/** Hozir ochiqmi va qachongacha / qachon ochiladi */
export function openStatus(hours: Hours, now = new Date()) {
  const open = isOpenAt(now, hours);
  return open
    ? { open: true, label: `Ochiq · ${hours.close_time} gacha` }
    : { open: false, label: `Yopiq · ${hours.open_time} dan` };
}
