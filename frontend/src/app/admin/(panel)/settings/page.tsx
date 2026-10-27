'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { digits, formatPrice } from '@/lib/utils';
import type { Product, Settings } from '@/lib/types';
import { AdminPageTitle } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/Toast';

type TgAdmin = { telegram_id: string; name: string | null; username: string | null; created_at: string };

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-card">
      <h2 className="text-[16px] font-extrabold">{title}</h2>
      {desc && <p className="mt-0.5 text-[13px] text-ink-500">{desc}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-cream-100 px-4 py-3">
      <span className="text-[14px] font-bold">{label}</span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </label>
  );
}

export default function AdminSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [admins, setAdmins] = useState<{ admins: TgAdmin[]; bot: string | null } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAdmins = () => adminApi<{ admins: TgAdmin[]; bot: string | null }>('/api/admin/admins').then(setAdmins);

  useEffect(() => {
    adminApi<{ settings: Settings }>('/api/admin/settings').then((r) => setS(r.settings));
    adminApi<{ items: Product[] }>('/api/admin/products').then((r) => setProducts(r.items));
    loadAdmins();
  }, []);

  if (!s) {
    return (
      <div className="grid place-items-center py-32">
        <Spinner className="h-8 w-8 text-gold-600" />
      </div>
    );
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  const money = (v: number) => (v ? formatPrice(v, false) : '');

  const save = async () => {
    setSaving(true);
    try {
      const r = await adminApi<{ settings: Settings }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(s) });
      setS(r.settings);
      toast.success('Sozlamalar saqlandi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (id: string) => {
    if (!window.confirm("Bu admin Telegram xabarlarini olmaydi. O'chirilsinmi?")) return;
    await adminApi(`/api/admin/admins?id=${id}`, { method: 'DELETE' });
    loadAdmins();
  };

  return (
    <>
      <AdminPageTitle
        title="Sozlamalar"
        subtitle="O'zgarishlar Mini App'da darhol ko'rinadi"
        actions={
          <Button onClick={save} loading={saving}>
            <Save size={17} /> Saqlash
          </Button>
        }
      />

      <div className="space-y-5 pb-24">
        <Section title="Ish holati" desc="Ish vaqtidan tashqarida mijozlar faqat oldindan buyurtma bera oladi">
          <Toggle label="Buyurtma qabul qilish" checked={s.accepting_orders} onChange={(v) => set('accepting_orders', v)} />
          <Field label="Tayyorlash vaqti (daqiqa)" hint="Oldindan buyurtma uchun eng yaqin vaqt">
            <Input type="number" value={s.prep_minutes} onChange={(e) => set('prep_minutes', Number(e.target.value))} />
          </Field>
          <Field label="Ochilish vaqti">
            <Input type="time" value={s.open_time} onChange={(e) => set('open_time', e.target.value)} />
          </Field>
          <Field label="Yopilish vaqti" hint="Yarim tundan keyin bo'lishi mumkin (masalan 01:00)">
            <Input type="time" value={s.close_time} onChange={(e) => set('close_time', e.target.value)} />
          </Field>
        </Section>

        <Section title="Buyurtma turlari">
          <Toggle label="🚚 Yetkazib berish" checked={s.delivery_enabled} onChange={(v) => set('delivery_enabled', v)} />
          <Toggle label="🛍 Olib ketish (oldindan buyurtma)" checked={s.pickup_enabled} onChange={(v) => set('pickup_enabled', v)} />
          <Toggle label="🍽 Joyida (stol band qilish)" checked={s.dinein_enabled} onChange={(v) => set('dinein_enabled', v)} />
          <Field label="Bepul yetkazish (so'mdan boshlab)" hint="0 — bepul yetkazish yo'q">
            <Input
              inputMode="numeric"
              value={money(s.free_delivery_from)}
              onChange={(e) => set('free_delivery_from', Number(digits(e.target.value)) || 0)}
            />
          </Field>
        </Section>

        <Section title="To'lov" desc="Karta orqali to'lovda mijoz shu kartaga pul o'tkazadi va chekni botga yuboradi">
          <Toggle label="💵 Naqd pul" checked={s.cash_enabled} onChange={(v) => set('cash_enabled', v)} />
          <Toggle label="💳 Karta orqali" checked={s.card_enabled} onChange={(v) => set('card_enabled', v)} />
          <Field label="Karta raqami" hint={s.card_number.includes('1234 5678') ? "⚠️ Bu TEST raqam — haqiqiy kartangizga almashtiring" : undefined}>
            <Input
              inputMode="numeric"
              value={s.card_number}
              onChange={(e) =>
                set(
                  'card_number',
                  digits(e.target.value)
                    .slice(0, 16)
                    .replace(/(\d{4})(?=\d)/g, '$1 ')
                )
              }
            />
          </Field>
          <Field label="Karta egasi">
            <Input value={s.card_holder} onChange={(e) => set('card_holder', e.target.value)} />
          </Field>
        </Section>

        <Section title="Ma'lumotlar">
          <Field label="Nomi">
            <Input value={s.restaurant_name} onChange={(e) => set('restaurant_name', e.target.value)} />
          </Field>
          <Field label="Shior">
            <Input value={s.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="Manzil">
            <Input value={s.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Telefonlar (vergul bilan)">
            <Input value={s.phones.join(', ')} onChange={(e) => set('phones', e.target.value.split(',').map((x) => x.trim()))} />
          </Field>
          <Field label="Instagram (username)">
            <Input value={s.instagram} onChange={(e) => set('instagram', e.target.value.replace('@', ''))} />
          </Field>
        </Section>

        <Section title="Aksiya banneri" desc="Bosh sahifadagi «Aksiya» kartasi">
          <Field label="Sarlavha">
            <Input value={s.promo_title} onChange={(e) => set('promo_title', e.target.value)} />
          </Field>
          <Field label="Matn">
            <Input value={s.promo_text} onChange={(e) => set('promo_text', e.target.value)} />
          </Field>
          <Field label="Bosilganda ochiladigan mahsulot">
            <select
              value={s.promo_product}
              onChange={(e) => set('promo_product', e.target.value)}
              className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 outline-none"
            >
              <option value="">— yo&apos;q —</option>
              {products
                .filter((p) => p.slug)
                .map((p) => (
                  <option key={p.id} value={p.slug!}>
                    {p.name}
                  </option>
                ))}
            </select>
          </Field>
        </Section>

        <section className="rounded-[24px] bg-white p-5 shadow-card">
          <h2 className="text-[16px] font-extrabold">Telegram xabarnomalari</h2>
          <p className="mt-1 text-[13.5px] text-ink-700">
            Yangi buyurtmalar haqida Telegram&apos;da xabar olish uchun botga yozing:{' '}
            <code className="rounded-lg bg-cream-100 px-2 py-0.5 font-bold">/admin PAROL</code>
            {admins?.bot && (
              <>
                {' '}
                —{' '}
                <a href={`https://t.me/${admins.bot}`} target="_blank" rel="noreferrer" className="font-bold text-sky-700">
                  @{admins.bot}
                </a>
              </>
            )}
            . Parol — admin panelga kirish paroli.
          </p>
          <div className="mt-4 divide-y divide-cream-200 rounded-2xl bg-cream-50">
            {admins?.admins.length === 0 && <p className="p-4 text-[13.5px] text-ink-500">Hali hech kim ulanmagan</p>}
            {admins?.admins.map((a) => (
              <div key={a.telegram_id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-[14px] font-bold">{a.name || 'Admin'}</div>
                  <div className="text-[12.5px] text-ink-500">
                    {a.username ? `@${a.username} · ` : ''}ID {a.telegram_id}
                  </div>
                </div>
                <button onClick={() => removeAdmin(a.telegram_id)} className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-chili-500" aria-label="O'chirish">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-4 right-4 z-30 lg:right-8">
        <Button size="lg" onClick={save} loading={saving} className="shadow-float">
          <Save size={18} /> Saqlash
        </Button>
      </div>
    </>
  );
}
