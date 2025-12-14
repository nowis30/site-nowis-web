import type { Metadata } from 'next';
import './globals.css';
import { BackgroundMusic } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Création NOWIS – Production musicale avec intelligence artificielle',
  description:
    'Production musicale propulsée par l\'IA. Je crée des chansons originales, jingles, thèmes de podcast et contenus musicaux sur mesure pour entreprises et événements avec l\'intelligence artificielle.',
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
        {children}
        <BackgroundMusic />
      </body>
    </html>
  );
}
