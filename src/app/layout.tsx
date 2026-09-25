import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cultivos & Huerto - Granja OS',
  description: 'Control de huerto, cilantro, parcelas y frutales a 2.200 msnm',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-emerald-50/40 text-slate-900 pb-safe">
        {children}
      </body>
    </html>
  );
}
