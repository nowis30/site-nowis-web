import { buildMetadata } from '@/lib/seo';
import { HomeScreen } from '@/screens';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Création Nowis | Ateliers IA, chansons personnalisées et vidéos créatives à Drummondville',
  description:
    'Découvrez Création Nowis : ateliers de création musicale avec l IA pour écoles, aînés et organismes, chansons personnalisées et vidéos créatives à Drummondville et partout au Québec.',
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
