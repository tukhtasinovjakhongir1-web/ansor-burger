'use client';

import { useEffect, useState } from 'react';
import { Download, Search, Send } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatDateTime } from '@/lib/time';
import { formatPrice, telLink } from '@/lib/utils';
import { AdminPageTitle } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

type Customer = {
  phone: string;
  name: string;
  username: string | null;
  telegram_id: string | null;
  orders: number;
  spent: number;
  last_order_at: string;
  first_order_at: string;
};

export default function AdminCustomersPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{ customers: Customer[]; botUsers: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi<{ customers: Customer[]; botUsers: number }>(`/api/admin/customers?q=${encodeURIComponent(query)}`).then(setData);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Ism', 'Telefon', 'Telegram', 'Buyurtmalar', "Jami (so'm)", 'Oxirgi buyurtma'],
      ...data.customers.map((c) => [c.name, c.phone, c.username ? '@' + c.username : '', c.orders, c.spent, formatDateTime(c.last_order_at)]),
    ];
    const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'ansor-mijozlar.csv';
    a.click();
  };

  return (
    <>
      <AdminPageTitle
        title="Mijozlar"
        subtitle={data ? `${data.customers.length} ta buyurtmachi · botda ${data.botUsers} ta foydalanuvchi` : undefined}
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download size={17} /> Excel (CSV)
          </Button>
        }
      />
      <div className="mb-4 flex h-11 items-center gap-2 rounded-2xl bg-white px-4 shadow-card">
        <Search size={18} className="text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, telefon yoki username..."
          className="h-full flex-1 bg-transparent text-[14px] outline-none"
        />
      </div>

      {!data ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-8 w-8 text-gold-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[22px] bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="bg-cream-100 text-[12.5px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Mijoz</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Telegram</th>
                <th className="px-4 py-3 text-right">Buyurtmalar</th>
                <th className="px-4 py-3 text-right">Jami</th>
                <th className="px-4 py-3">Oxirgi</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-500">
                    Hali mijozlar yo&apos;q
                  </td>
                </tr>
              )}
              {data.customers.map((c) => (
                <tr key={c.phone} className="border-t border-cream-200">
                  <td className="px-4 py-3 font-bold">{c.name}</td>
                  <td className="px-4 py-3">
                    <a href={telLink(c.phone)} className="font-semibold text-ink-700 hover:underline">
                      {c.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {c.username ? (
                      <a href={`https://t.me/${c.username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-700">
                        <Send size={13} /> @{c.username}
                      </a>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-extrabold text-gold-700">{formatPrice(c.spent)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(c.last_order_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
