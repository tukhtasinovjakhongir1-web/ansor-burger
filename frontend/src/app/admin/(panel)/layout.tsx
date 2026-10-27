import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAdmin } from '@/lib/server/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin — Ansor Burger', robots: { index: false } };

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login');
  return <AdminShell>{children}</AdminShell>;
}
