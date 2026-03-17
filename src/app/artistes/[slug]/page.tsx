import { notFound } from 'next/navigation';
import { ArtistProfilePage } from '@/components/artists/ArtistProfilePage';
import { getAllArtists, getArtistBySlug } from '@/data/artists';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return getAllArtists().map((artist) => ({ slug: artist.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const artist = getArtistBySlug(params.slug);

  if (!artist) {
    return buildMetadata({
      title: 'Artiste introuvable | Création Nowis',
      description: 'La page artiste demandée est introuvable.',
      path: `/artistes/${params.slug}`,
    });
  }

  return buildMetadata({
    title: `${artist.pageTitle} | Création Nowis`,
    description: artist.seoDescription,
    path: `/artistes/${artist.slug}`,
    image: artist.image?.src || '/hero.jpg',
    keywords: [artist.name, artist.role, 'Création Nowis', 'artiste musique Québec', 'chanson personnalisée'],
  });
}

export default function ArtistDetailPage({ params }: { params: { slug: string } }) {
  const artist = getArtistBySlug(params.slug);

  if (!artist) {
    notFound();
  }

  return <ArtistProfilePage artist={artist} />;
}
