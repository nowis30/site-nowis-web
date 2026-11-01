import type { Metadata } from 'next';
import { GalopGame } from '@/components/jeux/a-deux-au-galop/GalopGame';
import { buildMetadata } from '@/lib/seo';

const description = 'Retrouve Noisette sur le domaine, soigne-la, monte-la et gagne tes écus, directement dans ton navigateur.';

export const metadata: Metadata = buildMetadata({
  title: 'À deux au galop | Jeu de cheval dans le navigateur | Jeux NOWIS',
  description,
  path: '/jeux/a-deux-au-galop',
  image: '/jeux/a-deux-au-galop/vignette.webp',
  keywords: ['À deux au galop', 'Noisette', 'jeu de cheval', 'jeu navigateur', 'Jeux NOWIS', 'Création Nowis'],
});

export default function ADeuxAuGalopPage() {
  return <GalopGame />;
}
