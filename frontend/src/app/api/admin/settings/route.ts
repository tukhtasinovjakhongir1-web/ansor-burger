import { requireAdmin } from '@/lib/server/auth';
import { DEFAULT_SETTINGS, getSettings, saveSettings } from '@/lib/server/menu';
import type { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json({ settings: await getSettings() });
}

/** Faqat ma'lum kalitlar, standart qiymat turiga moslab saqlanadi */
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in body)) continue;
    const v = body[key];
    if (typeof def === 'boolean') patch[key] = Boolean(v);
    else if (typeof def === 'number') patch[key] = Math.max(0, Math.round(Number(v) || 0));
    else if (Array.isArray(def))
      patch[key] = (Array.isArray(v) ? v : String(v).split(','))
        .map((s: unknown) => String(s).trim())
        .filter(Boolean);
    else patch[key] = String(v ?? '').trim();
  }
  for (const k of ['open_time', 'close_time'] as const) {
    if (k in patch && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(patch[k]))) {
      return Response.json({ error: 'Vaqt HH:MM formatida bo\'lishi kerak' }, { status: 422 });
    }
  }
  const settings = await saveSettings(patch as Partial<Settings>);
  return Response.json({ settings });
}
