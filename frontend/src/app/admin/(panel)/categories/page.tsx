'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { Product } from '@/lib/types';
import { CrudPage } from '@/components/admin/CrudPage';

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[ʻʼ‘’`']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `cat-${Date.now().toString(36)}`
  );
}

export default function AdminCategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    adminApi<{ items: Product[] }>('/api/admin/products').then((r) => setProducts(r.items));
  }, []);
  const gallery = [...new Set(products.map((p) => p.image).filter(Boolean))] as string[];

  return (
    <CrudPage
      title="Kategoriyalar"
      subtitle="Menyu bo'limlari va ularning tartibi"
      endpoint="/api/admin/categories"
      itemName="kategoriya"
      imageKey="image"
      emojiKey="emoji"
      gallery={gallery}
      describe={(c) => (
        <>
          {products.filter((p) => p.category_id === c.id).length} ta mahsulot · tartib: {c.sort} · {c.slug}
        </>
      )}
      toggles={[{ key: 'is_active', label: "Ko'rinadi" }]}
      defaults={{ name: '', slug: '', emoji: '', image: '', sort: 100, is_active: true }}
      fields={[
        { key: 'name', label: 'Nomi', type: 'text', required: true },
        { key: 'emoji', label: 'Emoji', type: 'text', placeholder: '🍔' },
        { key: 'slug', label: 'Slug (lotin harflarda)', type: 'text', hint: "Bo'sh qoldirsangiz nomidan yasaladi" },
        { key: 'sort', label: 'Tartib raqami', type: 'number' },
        { key: 'image', label: 'Rasm (doira ichida ko\'rinadi)', type: 'image' },
        { key: 'is_active', label: "Menyuda ko'rinadi", type: 'bool' },
      ]}
      beforeSave={(body) => {
        if (!String(body.slug || '').trim()) body.slug = slugify(String(body.name || ''));
        return body;
      }}
    />
  );
}
