import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'ab_admin';
const SESSION_DAYS = 14;

function secret() {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error('SESSION_SECRET yoki ADMIN_PASSWORD sozlanmagan');
  return s;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || '';
  return expected.length > 0 && safeEqual(password, expected);
}

export function createSessionToken() {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `admin.${exp}`;
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_DAYS * 86_400 };
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!safeEqual(sig, sign(payload))) return false;
  const exp = Number(payload.split('.')[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** API yo'llarida: admin bo'lmasa 401 qaytaradi */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
}
