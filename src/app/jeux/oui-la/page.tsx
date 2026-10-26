import type { Metadata } from 'next';
import { OuiLaApp } from '@/components/jeux/oui-la/OuiLaApp';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Oui là | Jeu de soirée NOWIS',
  description:
    'Questions oui ou non à jouer en gang. Un écran pour la salle, chaque personne répond sur son cellulaire avec le code QR.',
  path: '/jeux/oui-la',
  image: '/nowis.png',
  keywords: ['Oui là', 'jeu de soirée', 'questions oui non', 'Jeux NOWIS', 'Création Nowis'],
});

export default async function OuiLaPage({ searchParams }: { searchParams: Promise<{ salle?: string }> }) {
  const params = await searchParams;
  const salle = String(params.salle ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return <OuiLaApp initialCode={salle} />;
}
