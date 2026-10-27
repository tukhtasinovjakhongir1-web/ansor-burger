export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** 25000 -> "25 000 so'm" */
export function formatPrice(value: number | null | undefined, withCurrency = true) {
  const n = Math.round(Number(value) || 0);
  const s = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return withCurrency ? `${s} so'm` : s;
}

/** Faqat raqamlar: "+998 (90) 123-45-67" -> "998901234567" */
export function digits(value: string) {
  return value.replace(/\D/g, '');
}

/** Kiritilayotgan raqamni "+998 90 123 45 67" ko'rinishiga keltiradi */
export function formatPhoneInput(value: string) {
  let d = digits(value);
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return '+998' + (parts.length ? ' ' + parts.join(' ') : '');
}

export function isValidPhone(value: string) {
  const d = digits(value);
  return /^998\d{9}$/.test(d);
}

export function telLink(phone: string) {
  return 'tel:+' + digits(phone);
}

/** Rasm uchun kattaroq versiya: "_thumb.webp" -> ".jpg" (agar mavjud bo'lsa) */
export function largeImage(src: string | null | undefined) {
  if (!src) return '/logo.png';
  return src.startsWith('/images/') ? src.replace('_thumb.webp', '.jpg') : src;
}

export function pluralItems(n: number) {
  return `${n} ta`;
}
