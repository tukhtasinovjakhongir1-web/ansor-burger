import { getMenu } from '@/lib/server/menu';

export const dynamic = 'force-dynamic';

export async function GET() {
  const menu = await getMenu();
  return Response.json(menu, { headers: { 'Cache-Control': 'no-store' } });
}
