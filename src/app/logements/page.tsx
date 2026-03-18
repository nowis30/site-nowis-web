import { LogementsScreen } from '@/screens/LogementsScreen';
import { getPublishedListings } from '@/lib/logements';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Logements à louer | Création Nowis',
  description:
    'Explorez les logements à louer avec photos, tarifs mensuels en dollars canadiens, localisation et demande de visite au Québec.',
  path: '/logements',
  keywords: ['logements à louer Québec', 'location appartement Québec', 'logements Création Nowis'],
});

export default async function LogementsPage() {
  const listings = await getPublishedListings();
  return <LogementsScreen logements={listings} />;
}
