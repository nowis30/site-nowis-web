import type { Metadata } from 'next';
import './globals.css';
import { UnregisterServiceWorker } from '@/components/UnregisterServiceWorker';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Nowis Morin — Chansons, vidéos et créations IA au Québec',
    description:
      'Nowis Morin crée des chansons, vidéos, visuels et projets créatifs avec l’aide de l’intelligence artificielle. Une vitrine artistique et marketing pensée pour l’écoute, la découverte et la prise de contact.',
    path: '/',
    keywords: ['Nowis Morin', 'Nowis Morin chanson', 'musique Nowis Morin', 'chanson IA Québec', 'artiste musique IA Québec'],
  }),
  manifest: '/manifest.json',
  icons: {
    icon: '/hero.jpg',
    apple: '/hero.jpg',
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
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Création NOWIS" />
      </head>
      <body className="bg-gray-50 text-gray-900">
        <UnregisterServiceWorker />
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
