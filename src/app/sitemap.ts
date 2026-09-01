import type { MetadataRoute } from 'next';
import { getAllArtists } from '@/data/artists';
import { getAllSongs } from '@/data/songs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nowis.store';

const staticPages = [
  { path: '', priority: 1 },
  { path: '/services', priority: 0.95 },
  { path: '/ateliers', priority: 0.9 },
  { path: '/commander-une-chanson', priority: 0.9 },
  { path: '/creations', priority: 0.85 },
  { path: '/portfolio', priority: 0.85 },
  { path: '/jeux', priority: 0.85 },
  { path: '/musique', priority: 0.85 },
  { path: '/videos', priority: 0.85 },
  { path: '/shop', priority: 0.75 },
  { path: '/a-propos', priority: 0.75 },
  { path: '/contact', priority: 0.75 },
  { path: '/tarifs', priority: 0.75 },
  { path: '/autres-services', priority: 0.65 },
  { path: '/ateliers/atelier-creatif', priority: 0.7 },
  { path: '/artistes', priority: 0.7 },
  { path: '/logements', priority: 0.7 },
  { path: '/avant-de-mecrire', priority: 0.6 },
  { path: '/confidentialite', priority: 0.4 },
  { path: '/conditions-de-vente', priority: 0.4 },
  { path: '/mentions-legales', priority: 0.4 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getAllSongs();
  const artists = getAllArtists();

  return [
    ...staticPages.map(({ path, priority }) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority,
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
