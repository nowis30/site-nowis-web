import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { YesNoGameLoader } from '@/components/jeux/combien-de-oui/YesNoGameLoader';

export const metadata: Metadata = buildMetadata({
  title: 'Combien de Oui? | Jeu de groupe sur cellulaire | Jeux NOWIS',
  description:
    'Jeu de party multijoueur : tout le monde répond oui ou non en secret sur son cellulaire, puis devine combien ont dit oui. Gratuit, sans application à installer, iPhone et Android.',
  path: '/jeux/combien-de-oui',
  image: '/nowis.png',
  keywords: ['Combien de Oui', 'jeu de groupe', 'jeu de party cellulaire', 'jeu multijoueur iPhone', 'Jeux NOWIS', 'Création Nowis'],
});

export default function CombienDeOuiPage() {
  return <YesNoGameLoader />;
}
