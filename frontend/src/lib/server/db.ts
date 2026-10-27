import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL sozlanmagan');
    client = neon(url);
  }
  return client;
}

/** Parametrli so'rov: q('SELECT * FROM orders WHERE id = $1', [id]) */
export async function q<T = Record<string, any>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(text, params)) as T[];
}

export async function one<T = Record<string, any>>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}
