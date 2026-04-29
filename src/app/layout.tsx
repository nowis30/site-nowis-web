import type { Metadata } from 'next';
import Script from 'next/script';
import { Alfa_Slab_One, Inter } from 'next/font/google';
import './globals.css';
import { UnregisterServiceWorker } from '@/components/UnregisterServiceWorker';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CookieBanner } from '@/components/CookieBanner';
import { buildMetadata } from '@/lib/seo';
import { buildOrganizationSchema } from '@/lib/structured-data';

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

const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || '';
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || '';
const googleTagId = ga4MeasurementId || googleAdsId;

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Création Nowis | Ateliers de création musicale avec IA et chansons personnalisées au Québec',
    description:
      'Création Nowis, avec Nowis Morin à Drummondville, propose des ateliers de création musicale avec l IA, des chansons personnalisées et des vidéos créatives partout au Québec.',
    path: '/',
    keywords: ['Création Nowis', 'création musicale avec IA', 'atelier IA Québec', 'chanson personnalisée Drummondville', 'Nowis Morin'],
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
  const organizationSchema = buildOrganizationSchema();

  return (
    <html lang="fr" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        <meta name="theme-color" content="#f6f1ea" />
        <meta name="mobile-web-app-capable" content="yes" />
          {googleTagId ? (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
                strategy="afterInteractive"
              />
              <Script id="google-gtag-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  ${ga4MeasurementId ? `gtag('config', '${ga4MeasurementId}');` : ''}
                  ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
                `}
              </Script>
            </>
          ) : null}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Création NOWIS" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </head>
      <body className="bg-[#fcf7f1] text-[color:var(--site-text)] font-sans">
        <UnregisterServiceWorker />
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
