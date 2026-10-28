import 'server-only';
import { one, q } from './db';
import { requireAdmin } from './auth';
import { revalidateMenu } from './menu';

type FieldType = 'text' | 'textnull' | 'int' | 'intnull' | 'bool';
export type TableConfig = {
  table: string;
  fields: Record<string, FieldType>;
  required?: string[];
  orderBy: string;
};

function coerce(type: FieldType, value: unknown) {
  switch (type) {
    case 'text':
      return String(value ?? '').trim();
    case 'textnull': {
      const s = String(value ?? '').trim();
      return s ? s : null;
    }
    case 'int':
      return Math.round(Number(value) || 0);
    case 'intnull':
      return value === null || value === '' || value === undefined ? null : Math.round(Number(value) || 0);
    case 'bool':
      return Boolean(value);
  }
}

function pick(cfg: TableConfig, body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, type] of Object.entries(cfg.fields)) {
    if (key in body) out[key] = coerce(type, body[key]);
  }
  return out;
}

/** Admin uchun umumiy CRUD route handlerlari */
export function collectionHandlers(cfg: TableConfig) {
  return {
    async GET() {
      const denied = await requireAdmin();
      if (denied) return denied;
      const rows = await q(`SELECT * FROM ${cfg.table} ORDER BY ${cfg.orderBy}`);
      return Response.json({ items: rows });
    },
    async POST(req: Request) {
      const denied = await requireAdmin();
      if (denied) return denied;
      const data = pick(cfg, await req.json().catch(() => ({})));
      for (const r of cfg.required || []) {
        if (data[r] === undefined || data[r] === '' || data[r] === null) {
          return Response.json({ error: `"${r}" maydoni majburiy` }, { status: 422 });
        }
      }
      const keys = Object.keys(data);
      if (!keys.length) return Response.json({ error: "Ma'lumot yo'q" }, { status: 422 });
      try {
        const row = await one(
          `INSERT INTO ${cfg.table} (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
          keys.map((k) => data[k])
        );
        revalidateMenu();
        return Response.json({ item: row });
      } catch (err) {
        return Response.json({ error: dbError(err) }, { status: 422 });
      }
    },
  };
}

export function itemHandlers(cfg: TableConfig) {
  type Ctx = { params: Promise<{ id: string }> };
  return {
    async PATCH(req: Request, { params }: Ctx) {
      const denied = await requireAdmin();
      if (denied) return denied;
      const { id } = await params;
      const data = pick(cfg, await req.json().catch(() => ({})));
      const keys = Object.keys(data);
      if (!keys.length) return Response.json({ error: "Ma'lumot yo'q" }, { status: 422 });
      try {
        const row = await one(
          `UPDATE ${cfg.table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
          [...keys.map((k) => data[k]), Number(id)]
        );
        if (!row) return Response.json({ error: 'Topilmadi' }, { status: 404 });
        revalidateMenu();
        return Response.json({ item: row });
      } catch (err) {
        return Response.json({ error: dbError(err) }, { status: 422 });
      }
    },
    async DELETE(_req: Request, { params }: Ctx) {
      const denied = await requireAdmin();
      if (denied) return denied;
      const { id } = await params;
      await q(`DELETE FROM ${cfg.table} WHERE id = $1`, [Number(id)]);
      revalidateMenu();
      return Response.json({ ok: true });
    },
  };
}

function dbError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('duplicate key')) return 'Bunday qiymat allaqachon mavjud (slug takrorlanmasligi kerak)';
  return 'Saqlashda xatolik: ' + msg;
}

export const PRODUCTS: TableConfig = {
  table: 'products',
  orderBy: 'sort, id',
  required: ['name'],
  fields: {
    slug: 'textnull',
    category_id: 'intnull',
    name: 'text',
    description: 'text',
    price: 'int',
    old_price: 'intnull',
    image: 'textnull',
    price_note: 'textnull',
    is_available: 'bool',
    is_popular: 'bool',
    is_active: 'bool',
    sort: 'int',
  },
};

export const CATEGORIES: TableConfig = {
  table: 'categories',
  orderBy: 'sort, id',
  required: ['name', 'slug'],
  fields: { slug: 'text', name: 'text', emoji: 'textnull', image: 'textnull', sort: 'int', is_active: 'bool' },
};

export const ZONES: TableConfig = {
  table: 'zones',
  orderBy: 'sort, id',
  required: ['name'],
  fields: { name: 'text', fee: 'int', min_order: 'int', eta_min: 'int', is_active: 'bool', sort: 'int' },
};
