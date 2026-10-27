import { cookies } from 'next/headers';
import { checkPassword, createSessionToken, SESSION_COOKIE } from '@/lib/server/auth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (!checkPassword(String(password || ''))) {
    await new Promise((r) => setTimeout(r, 700)); // parolni tanlab ko'rishni sekinlashtiradi
    return Response.json({ error: "Parol noto'g'ri" }, { status: 401 });
  }
  const { token, maxAge } = createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return Response.json({ ok: true });
}
