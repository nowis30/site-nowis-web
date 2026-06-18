import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { GamesScreen } from '@/components/jeux/GamesScreen';

export const metadata: Metadata = buildMetadata({
  title: 'Jeux NOWIS | Mini-jeux et radio musicale de Création Nowis',
  description:
    'Joue à des mini-jeux HTML/JavaScript depuis la page Jeux NOWIS tout en écoutant la radio musicale de Création Nowis en boucle.',
  path: '/jeux',
  image: '/nowis.png',
  keywords: ['Jeux NOWIS', 'mini-jeux HTML', 'radio musicale', 'Création Nowis'],
});

export default function JeuxPage() {
  return <GamesScreen />;
}
