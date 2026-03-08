import { notFound } from 'next/navigation';
import { getPublishedListingBySlug, getPublishedListings } from '@/lib/logements';
import { LogementDetailScreen } from '@/screens/LogementDetailScreen';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);

  if (!logement) {
    return {
      title: 'Logement introuvable - NOWIS',
      description: 'Le logement demandé est introuvable.',
    };
  }

  return {
    title: `${logement.title} – Logement`,
    description: logement.descriptionShort,
  };
}

export async function generateStaticParams() {
  const logements = await getPublishedListings();
  return logements.map((logement) => ({ slug: logement.slug }));
}

export default async function LogementPage({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);
  if (!logement) {
    notFound();
  }

  return <LogementDetailScreen logement={logement} />;
}
