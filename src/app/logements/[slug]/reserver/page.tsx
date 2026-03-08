import { notFound } from 'next/navigation';
import { getPublishedListingBySlug } from '@/lib/logements';
import { LogementBookingScreen } from '@/screens/LogementBookingScreen';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);

  if (!logement) {
    return {
      title: 'Réservation - Logement introuvable - NOWIS',
      description: 'Cette réservation n’est pas disponible car le logement est introuvable.',
    };
  }

  return {
    title: `Réserver - ${logement.title} - NOWIS`,
    description: `Réserver une visite pour ${logement.title} à ${logement.city}.`,
  };
}

export default async function BookingPage({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);
  if (!logement) {
    notFound();
  }

  return <LogementBookingScreen logement={logement} />;
}
