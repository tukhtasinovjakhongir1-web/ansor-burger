import type { Metadata } from 'next';

const TITLE = 'Admin panel — Ansor Burger';
const DESCRIPTION = 'Buyurtmalar, menyu, mijozlar va statistika — barchasi bir joyda.';

// /admin va /admin/login havolalari uchun alohida banner
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false },
  openGraph: {
    type: 'website',
    siteName: 'Ansor Burger',
    locale: 'uz_UZ',
    title: TITLE,
    description: DESCRIPTION,
    url: '/admin',
    images: [{ url: '/og/og-admin.jpg', width: 1200, height: 630, alt: 'Ansor Burger admin panel' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og/og-admin.jpg'] },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
