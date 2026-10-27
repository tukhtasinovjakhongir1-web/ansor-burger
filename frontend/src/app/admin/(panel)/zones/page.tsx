'use client';

import { formatPrice } from '@/lib/utils';
import { CrudPage } from '@/components/admin/CrudPage';

export default function AdminZonesPage() {
  return (
    <CrudPage
      title="Yetkazib berish hududlari"
      subtitle="Shahrixon tumani bo'ylab hududlar, yetkazish narxi va minimal buyurtma"
      endpoint="/api/admin/zones"
      itemName="hudud"
      describe={(z) => (
        <>
          Yetkazish: <b className="text-gold-700">{z.fee ? formatPrice(z.fee) : 'bepul'}</b> · min. buyurtma {formatPrice(z.min_order)} · ~
          {z.eta_min} daqiqa
        </>
      )}
      toggles={[{ key: 'is_active', label: 'Faol' }]}
      defaults={{ name: '', fee: 10000, min_order: 30000, eta_min: 40, sort: 100, is_active: true }}
      fields={[
        { key: 'name', label: 'Hudud nomi', type: 'text', required: true, full: true, placeholder: "Masalan: Shahrixon shahri — markaz" },
        { key: 'fee', label: "Yetkazish narxi (so'm)", type: 'money' },
        { key: 'min_order', label: "Minimal buyurtma (so'm)", type: 'money' },
        { key: 'eta_min', label: 'Taxminiy vaqt (daqiqa)', type: 'number' },
        { key: 'sort', label: 'Tartib raqami', type: 'number' },
        { key: 'is_active', label: 'Faol', type: 'bool' },
      ]}
    />
  );
}
