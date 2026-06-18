import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { GameDetailScreen } from '@/components/jeux/GameDetailScreen';
import { findGameBySlug, gameCatalog } from '@/components/jeux/gameCatalog';

type GamePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return gameCatalog.map((game) => ({ slug: game.slug }));
}

export function generateMetadata({ params }: GamePageProps): Metadata {
  const game = findGameBySlug(params.slug);

  if (!game) {
    return buildMetadata({
      title: 'Jeu introuvable | Jeux NOWIS',
      description: 'Le jeu demandé est introuvable sur Jeux NOWIS.',
      path: `/jeux/${params.slug}`,
      image: '/nowis.png',
    });
  }

  return buildMetadata({
    title: `${game.name} | Jeux NOWIS`,
    description: `Joue à ${game.name} sur Jeux NOWIS tout en écoutant la radio musicale de Création Nowis.`,
    path: `/jeux/${game.slug}`,
    image: '/nowis.png',
    keywords: [game.name, 'Jeux NOWIS', 'mini-jeu HTML', 'Création Nowis'],
  });
}

export default function GamePage({ params }: GamePageProps) {
  const game = findGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  return <GameDetailScreen game={game} />;
}