import type { Metadata } from 'next';
import { Alfa_Slab_One, Inter } from 'next/font/google';
import './globals.css';
import { UnregisterServiceWorker } from '@/components/UnregisterServiceWorker';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { buildMetadata } from '@/lib/seo';

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Alfa_Slab_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Création Nowis | Chansons personnalisées et créations musicales',
    description:
      'Création Nowis propose des chansons personnalisées, des créations musicales sur mesure et des options visuelles ou vidéo IA pour accompagner les moments importants.',
    path: '/',
    keywords: ['Création Nowis', 'chanson personnalisée Québec', 'chansons sur mesure', 'Nowis Morin musique'],
  }),
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/android/launchericon-192x192.png',
    apple: '/icons/ios/1024.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Création NOWIS',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        <meta name="theme-color" content="#050816" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Création NOWIS" />
      </head>
      <body className="bg-coal-950 text-slate-100 font-sans">
        <UnregisterServiceWorker />
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
