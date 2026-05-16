import type { MetadataRoute } from 'next';
import { getAllArtists } from '@/data/artists';
import { getAllSongs } from '@/data/songs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nowis.store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getAllSongs();
  const artists = getAllArtists();
  const staticPages = [
    '',
    '/a-propos',
    '/ateliers',
    '/ateliers/atelier-creatif',
    '/autres-services',
    '/commander-une-chanson',
    '/contact',
    '/services',
    '/creations',
    '/tarifs',
    '/musique',
    '/videos',
    '/artistes',
    '/logements',
    '/avant-de-mecrire',
    '/confidentialite',
    '/conditions-de-vente',
    '/mentions-legales',
  ];

  return [
    ...staticPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...songs.map((song) => ({
      url: `${siteUrl}/chanson/${song.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...artists.map((artist) => ({
      url: `${siteUrl}/artistes/${artist.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
