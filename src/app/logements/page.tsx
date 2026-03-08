import { LogementsScreen } from '@/screens/LogementsScreen';
import { getPublishedListings } from '@/lib/logements';

export const metadata = {
  title: 'Logements à louer - NOWIS',
  description:
    'Explorez nos logements à louer : photos, tarifs, localisation et réservation de visite. Découvrez votre prochain logement en quelques clics.',
};

export default async function LogementsPage() {
  const listings = await getPublishedListings();
  return <LogementsScreen logements={listings} />;
}
