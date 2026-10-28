import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Manrope, Montserrat } from 'next/font/google';
import { appUrl } from '@/lib/server/telegram';
import '@/styles/globals.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope', display: 'swap' });
const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const TITLE = 'Ansor Burger — Shahrixon';
const DESCRIPTION = "🍔 Turkiyaning eng mashhur taomlari. Shahrixon bo'ylab tez yetkazib berish va oldindan buyurtma.";

export const metadata: Metadata = {
  // Telegram va boshqa ilovalarda havola yuborilganda chiroyli banner (og:image) chiqishi uchun
  metadataBase: new URL(appUrl() || 'http://localhost:3000'),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Ansor Burger',
  icons: { icon: '/icon-192.png', apple: '/icon-512.png' },
  openGraph: {
    type: 'website',
    siteName: 'Ansor Burger',
    locale: 'uz_UZ',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    images: [{ url: '/og/og-shop.jpg', width: 1200, height: 630, alt: 'Ansor Burger — mazali turk taomlari' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og/og-shop.jpg'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#fff4ea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // telegram-web-app.js <html> ga CSS o'zgaruvchilar qo'shadi — shu sababli suppressHydrationWarning
    <html lang="uz" className={`${manrope.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
