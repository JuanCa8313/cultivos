import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Granja Cultivos 🌱 - Granja OS',
  description: 'Control de huerto, cilantro, parcelas y frutales a 2.200 msnm',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Granja Cultivos',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-emerald-50/40 text-slate-900 pb-safe">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
