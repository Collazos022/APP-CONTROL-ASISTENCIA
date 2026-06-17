import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import './globals.css';

export const metadata: Metadata = {
  title: 'ASSAM - Registro de Personal',
  description: 'Aplicación para el registro y control de personal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* PWA Manifest and Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003d1d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ASSAM" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body className="font-body antialiased">
        <PwaRegister />
        {children}
        <PwaInstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
