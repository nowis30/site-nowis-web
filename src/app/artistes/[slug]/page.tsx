import { notFound } from 'next/navigation';
import { ArtistProfilePage } from '@/components/artists/ArtistProfilePage';
import { getAllArtists, getArtistBySlug } from '@/data/artists';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return getAllArtists().map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
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
    image: artist.image?.src || '/nowis.png',
    keywords: [artist.name, artist.role, 'Création Nowis', 'artiste musique Québec', 'chanson personnalisée'],
  });
}

export default async function ArtistDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const artist = getArtistBySlug(params.slug);

  if (!artist) {
    notFound();
  }

  return <ArtistProfilePage artist={artist} />;
}
