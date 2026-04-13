import { legalConfig } from '@/data/legal';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nowis.store';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Organization'],
    name: legalConfig.companyName,
    alternateName: 'Nowis Morin',
    url: siteUrl,
    logo: `${siteUrl}/nowis.png`,
    image: `${siteUrl}/hero.jpg`,
    email: legalConfig.contactEmail,
    telephone: legalConfig.contactPhone,
    founder: {
      '@type': 'Person',
      name: 'Nowis Morin',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '4667, rue Traversy',
      addressLocality: 'Drummondville',
      addressRegion: 'QC',
      addressCountry: 'CA',
    },
    areaServed: [
      { '@type': 'City', name: 'Drummondville' },
      { '@type': 'AdministrativeArea', name: 'Québec' },
      { '@type': 'Country', name: 'Canada' },
    ],
    knowsAbout: [
      'création musicale avec IA',
      'ateliers IA',
      'ateliers pour écoles',
      'ateliers pour aînés',
      'chansons personnalisées',
      'vidéos IA',
    ],
  };
}

export function buildServiceSchema({
  name,
  description,
  path,
  serviceType,
  audience,
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  audience?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${siteUrl}${path}`,
    serviceType,
    provider: {
      '@type': 'LocalBusiness',
      name: legalConfig.companyName,
      areaServed: 'Québec, Canada',
    },
    areaServed: [
      { '@type': 'City', name: 'Drummondville' },
      { '@type': 'AdministrativeArea', name: 'Québec' },
    ],
    audience: audience?.map((item) => ({ '@type': 'Audience', audienceType: item })),
  };
}

export function buildFaqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}