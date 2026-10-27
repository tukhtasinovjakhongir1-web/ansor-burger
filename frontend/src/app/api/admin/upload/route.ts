import { one } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/webp', 'image/jpeg', 'image/png'];

/** Rasm brauzerda kichraytiriladi (800px webp), shu yerda bazaga yoziladi */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Fayl topilmadi' }, { status: 422 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: 'Faqat JPG, PNG yoki WEBP' }, { status: 422 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Rasm 2 MB dan katta' }, { status: 422 });

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const row = await one<{ id: number }>(
    "INSERT INTO images (mime, data) VALUES ($1, decode($2, 'base64')) RETURNING id",
    [file.type, base64]
  );
  return Response.json({ url: `/api/img/${row!.id}` });
}
