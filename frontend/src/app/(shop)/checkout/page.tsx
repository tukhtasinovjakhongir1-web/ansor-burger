'use client';

import { PageHeader } from '@/components/layout/Header';
import { CheckoutForm } from '@/components/features/CheckoutForm';

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Rasmiylashtirish" />
      <CheckoutForm />
    </>
  );
}
