import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Manrope, Montserrat } from 'next/font/google';
import '@/styles/globals.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope', display: 'swap' });
const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ansor Burger — Shahrixon',
  description: "Turkiyaning eng mashhur taomlari. Shahrixon bo'ylab yetkazib berish va oldindan buyurtma.",
  icons: { icon: '/icon-192.png', apple: '/icon-512.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf6ec',
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
