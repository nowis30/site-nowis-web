import type { Metadata, Viewport } from 'next';
import { Alfa_Slab_One, Inter } from 'next/font/google';
import './globals.css';
import './public-polish.css';
import './public-conversion.css';
import './song-marketing.css';
import './radio.css';
import { RadioProvider } from '@/components/radio/RadioProvider';
import { UnregisterServiceWorker } from '@/components/UnregisterServiceWorker';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CookieBanner } from '@/components/CookieBanner';
import { ConsentGoogleTags } from '@/components/analytics/ConsentGoogleTags';
import { buildMetadata } from '@/lib/seo';
import { buildOrganizationSchema } from '@/lib/structured-data';
import { PrivateNavigationBoundary } from '@/components/PrivateNavigationBoundary';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const displayFont = Alfa_Slab_One({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });
const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || '';
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || '';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Création Nowis | Ateliers de création musicale avec IA et chansons personnalisées au Québec',
    description: 'Création Nowis, avec Nowis Morin à Drummondville, propose des ateliers de création musicale avec l IA, des chansons personnalisées et des vidéos créatives partout au Québec.',
    path: '/',
    keywords: ['Création Nowis', 'création musicale avec IA', 'atelier IA Québec', 'chanson personnalisée Drummondville', 'Nowis Morin'],
  }),
  manifest: '/manifest.json',
  icons: { icon: '/icons/android/launchericon-192x192.png', apple: '/icons/ios/1024.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Création NOWIS' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = buildOrganizationSchema();
  return (
    <html lang="fr" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        <meta name="theme-color" content="#f6f1ea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Création NOWIS" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </head>
      <body className="bg-[#fcf7f1] text-[color:var(--site-text)] font-sans">
        <PrivateNavigationBoundary>
        <UnregisterServiceWorker />
        <AuthProvider><RadioProvider><AppLayout>{children}</AppLayout></RadioProvider></AuthProvider>
        <ConsentGoogleTags measurementId={ga4MeasurementId} adsId={googleAdsId} />
        <CookieBanner />
        </PrivateNavigationBoundary>
      </body>
    </html>
  );
}
