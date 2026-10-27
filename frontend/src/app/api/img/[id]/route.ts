import { one } from '@/lib/server/db';

/** Admin paneldan yuklangan rasmlar bazada saqlanadi va shu yerdan beriladi */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await one<{ mime: string; data: string }>(
    "SELECT mime, encode(data, 'base64') AS data FROM images WHERE id = $1",
    [Number(id) || 0]
  );
  if (!row) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(row.data, 'base64'), {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
