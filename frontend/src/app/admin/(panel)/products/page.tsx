'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { CrudPage } from '@/components/admin/CrudPage';

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);

  useEffect(() => {
    adminApi<{ items: Category[] }>('/api/admin/categories').then((r) => setCategories(r.items));
  }, []);

  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name || 'Kategoriyasiz';
  const options = categories.map((c) => ({ value: c.id, label: `${c.emoji || ''} ${c.name}`.trim() }));

  return (
    <CrudPage
      title="Mahsulotlar"
      subtitle="Narx, rasm, mavjudlik (stop-list) va mashhurlarni boshqaring"
      endpoint="/api/admin/products"
      itemName="mahsulot"
      imageKey="image"
      searchKeys={['name', 'description']}
      filter={{ key: 'category_id', label: 'Kategoriya', options }}
      gallery={gallery}
      onItemsChange={(items) => setGallery([...new Set(items.map((i) => i.image).filter(Boolean))] as string[])}
      describe={(p) => (
        <>
          <b className="text-gold-700">{formatPrice(p.price)}</b>
          {p.old_price ? <span className="ml-1.5 line-through">{formatPrice(p.old_price, false)}</span> : null}
          <span className="mx-1.5">·</span>
          {catName(p.category_id)}
        </>
      )}
      badge={(p) =>
        p.price_note === 'taxminiy' ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">taxminiy narx</span>
        ) : null
      }
      toggles={[
        { key: 'is_available', label: 'Mavjud' },
        { key: 'is_popular', label: 'Mashhur' },
        { key: 'is_active', label: "Ko'rinadi" },
      ]}
      defaults={{
        name: '',
        description: '',
        price: null,
        old_price: null,
        category_id: categories[0]?.id ?? null,
        image: '',
        is_available: true,
        is_popular: false,
        is_active: true,
        sort: 100,
      }}
      fields={[
        { key: 'name', label: 'Nomi', type: 'text', required: true, full: true },
        { key: 'description', label: 'Tarkibi / tavsif', type: 'textarea' },
        { key: 'price', label: "Narxi (so'm)", type: 'money', required: true, hint: "O'zgartirilsa «taxminiy» belgisi olib tashlanadi" },
        { key: 'old_price', label: 'Eski narx (chegirma uchun)', type: 'money', hint: "Bo'sh qoldirsangiz chegirma ko'rinmaydi" },
        { key: 'category_id', label: 'Kategoriya', type: 'select', options },
        { key: 'sort', label: 'Tartib raqami', type: 'number', hint: 'Kichik raqam yuqorida turadi' },
        { key: 'image', label: 'Rasm', type: 'image' },
        { key: 'is_available', label: 'Mavjud (sotuvda)', type: 'bool' },
        { key: 'is_popular', label: 'Mashhur (bosh sahifada)', type: 'bool' },
        { key: 'is_active', label: "Menyuda ko'rinadi", type: 'bool' },
      ]}
      beforeSave={(body, original) => {
        if (!original || Number(body.price) !== Number(original.price)) body.price_note = null;
        body.category_id = body.category_id ? Number(body.category_id) : null;
        return body;
      }}
    />
  );
}
