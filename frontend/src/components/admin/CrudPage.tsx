'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn, digits, formatPrice } from '@/lib/utils';
import { AdminPageTitle } from './AdminShell';
import { ImageInput } from './ImageInput';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/Toast';

type Row = { id: number; [key: string]: any };

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'money' | 'bool' | 'image' | 'select';
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  endpoint: string;
  itemName: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  /** Ro'yxatda sarlavha ostidagi qator */
  describe: (row: Row) => ReactNode;
  titleKey?: string;
  imageKey?: string;
  emojiKey?: string;
  /** Ro'yxatdan turib yoqib-o'chiriladigan maydonlar */
  toggles?: { key: string; label: string }[];
  searchKeys?: string[];
  filter?: { key: string; label: string; options: { value: string | number; label: string }[] };
  gallery?: string[];
  beforeSave?: (draft: Record<string, unknown>, original: Row | null) => Record<string, unknown>;
  onItemsChange?: (items: Row[]) => void;
  badge?: (row: Row) => ReactNode;
};

export function CrudPage(props: Props) {
  const { endpoint, fields, toggles = [], titleKey = 'name' } = props;
  const [items, setItems] = useState<Row[] | null>(null);
  const [query, setQuery] = useState('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await adminApi<{ items: Row[] }>(endpoint);
    setItems(r.items);
    props.onItemsChange?.(r.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const visible = useMemo(() => {
    if (!items) return [];
    const qn = query.trim().toLowerCase();
    return items.filter((it) => {
      if (props.filter && filterValue !== '' && String(it[props.filter.key] ?? '') !== filterValue) return false;
      if (!qn) return true;
      return (props.searchKeys || [titleKey]).some((k) => String(it[k] ?? '').toLowerCase().includes(qn));
    });
  }, [items, query, filterValue, props.filter, props.searchKeys, titleKey]);

  const openNew = () => {
    setEditing(null);
    setDraft({ ...props.defaults });
  };
  const openEdit = (row: Row) => {
    setEditing(row);
    setDraft({ ...row });
  };
  const close = () => {
    setDraft(null);
    setEditing(null);
  };

  const save = async () => {
    if (!draft) return;
    for (const f of fields) {
      if (f.required && (draft[f.key] === '' || draft[f.key] === null || draft[f.key] === undefined)) {
        return toast.error(`"${f.label}" maydonini to'ldiring`);
      }
    }
    let body: Record<string, unknown> = {};
    for (const f of fields) body[f.key] = draft[f.key];
    if (props.beforeSave) body = props.beforeSave(body, editing);
    setSaving(true);
    try {
      if (editing) {
        const r = await adminApi<{ item: Row }>(`${endpoint}/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        setItems((list) => list?.map((x) => (x.id === editing.id ? r.item : x)) ?? null);
      } else {
        const r = await adminApi<{ item: Row }>(endpoint, { method: 'POST', body: JSON.stringify(body) });
        setItems((list) => [...(list || []), r.item]);
      }
      toast.success('Saqlandi');
      close();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`"${row[titleKey]}" o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    try {
      await adminApi(`${endpoint}/${row.id}`, { method: 'DELETE' });
      setItems((list) => list?.filter((x) => x.id !== row.id) ?? null);
      toast.success("O'chirildi");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  const quickToggle = async (row: Row, key: string, value: boolean) => {
    setItems((list) => list?.map((x) => (x.id === row.id ? { ...x, [key]: value } : x)) ?? null);
    try {
      await adminApi(`${endpoint}/${row.id}`, { method: 'PATCH', body: JSON.stringify({ [key]: value }) });
    } catch (err) {
      setItems((list) => list?.map((x) => (x.id === row.id ? { ...x, [key]: !value } : x)) ?? null);
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...(d || {}), [key]: value }));

  return (
    <>
      <AdminPageTitle
        title={props.title}
        subtitle={props.subtitle}
        actions={
          <Button onClick={openNew}>
            <Plus size={18} /> Yangi {props.itemName}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-card">
          <Search size={18} className="text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish..."
            className="h-full flex-1 bg-transparent text-[14px] outline-none"
          />
        </div>
        {props.filter && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="h-11 rounded-2xl bg-white px-4 text-[14px] font-semibold shadow-card outline-none"
          >
            <option value="">{props.filter.label}: hammasi</option>
            {props.filter.options.map((o) => (
              <option key={o.value} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {items === null ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8 text-gold-600" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] bg-white shadow-card">
          {visible.length === 0 && <p className="py-12 text-center text-ink-500">Hech narsa topilmadi</p>}
          {visible.map((row) => (
            <div
              key={row.id}
              onClick={() => openEdit(row)}
              className="flex cursor-pointer flex-wrap items-center gap-3 border-b border-cream-200 px-4 py-3 last:border-0 hover:bg-cream-50"
            >
              {props.imageKey && (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-200">
                  {row[props.imageKey] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row[props.imageKey]} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : props.emojiKey && row[props.emojiKey] ? (
                    <div className="grid h-full place-items-center text-2xl">{row[props.emojiKey]}</div>
                  ) : null}
                </div>
              )}
              <div className="min-w-[160px] flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[15px] font-extrabold">
                  {props.emojiKey && !props.imageKey && row[props.emojiKey]} {row[titleKey]}
                  {props.badge?.(row)}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-500">{props.describe(row)}</div>
              </div>
              {toggles.length > 0 && (
                <div className="flex flex-wrap items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  {toggles.map((t) => (
                    <label key={t.key} className="flex items-center gap-2 text-[12.5px] font-bold text-ink-700">
                      <Switch checked={Boolean(row[t.key])} onChange={(v) => quickToggle(row, t.key, v)} label={t.label} />
                      {t.label}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(row)} className="grid h-9 w-9 place-items-center rounded-xl bg-cream-100" aria-label="Tahrirlash">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(row)} className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-chili-500" aria-label="O'chirish">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(draft)}
        onClose={close}
        variant="center"
        title={editing ? `${props.itemName[0].toUpperCase()}${props.itemName.slice(1)}ni tahrirlash` : `Yangi ${props.itemName}`}
      >
        {draft && (
          <div className="px-5 pb-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={cn((f.full || f.type === 'textarea' || f.type === 'image') && 'sm:col-span-2')}>
                  {f.type === 'bool' ? (
                    <label className="flex h-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                      <span className="text-[14px] font-bold">{f.label}</span>
                      <Switch checked={Boolean(draft[f.key])} onChange={(v) => set(f.key, v)} label={f.label} />
                    </label>
                  ) : (
                    <Field label={f.label + (f.required ? ' *' : '')} hint={f.hint}>
                      {f.type === 'textarea' ? (
                        <Textarea value={draft[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
                      ) : f.type === 'image' ? (
                        <ImageInput value={draft[f.key] ?? ''} onChange={(v) => set(f.key, v)} gallery={props.gallery} />
                      ) : f.type === 'select' ? (
                        <select
                          value={draft[f.key] ?? ''}
                          onChange={(e) => set(f.key, e.target.value === '' ? null : e.target.value)}
                          className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 outline-none focus:border-gold-500"
                        >
                          <option value="">— tanlanmagan —</option>
                          {f.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : f.type === 'money' ? (
                        <Input
                          inputMode="numeric"
                          value={draft[f.key] === null || draft[f.key] === undefined || draft[f.key] === '' ? '' : formatPrice(draft[f.key], false)}
                          onChange={(e) => set(f.key, digits(e.target.value) === '' ? null : Number(digits(e.target.value)))}
                          placeholder={f.placeholder}
                        />
                      ) : (
                        <Input
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={draft[f.key] ?? ''}
                          onChange={(e) => set(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                          placeholder={f.placeholder}
                        />
                      )}
                    </Field>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              {editing && (
                <Button variant="danger" onClick={() => remove(editing)}>
                  <Trash2 size={17} />
                </Button>
              )}
              <Button variant="soft" onClick={close} className="flex-1">
                Bekor
              </Button>
              <Button onClick={save} loading={saving} className="flex-1">
                Saqlash
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
