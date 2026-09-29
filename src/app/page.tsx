import { buildMetadata } from '@/lib/seo';
import { HomeScreen } from '@/screens';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Chanson personnalisée à offrir | Création Nowis au Québec',
  description:
    'Offrez une chanson personnalisée pour un anniversaire, un amour ou un hommage. Écoutez Nowis et racontez votre idée, sans compte ni paiement pour la première demande.',
  path: '/',
  image: '/hero.jpg',
  keywords: [
    'création musicale avec IA',
    'ateliers IA Drummondville',
    'ateliers pour écoles Québec',
    'ateliers pour aînés Québec',
    'chansons personnalisées Québec',
    'vidéos IA Drummondville',
  ],
});

export default async function Home() {
  return <HomeScreen />;
}
