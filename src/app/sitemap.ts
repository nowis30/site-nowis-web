import type { MetadataRoute } from 'next';
import { getAllSongs } from '@/data/songs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nowis.store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getAllSongs();
  const staticPages = ['', '/musique', '/videos', '/a-propos', '/services', '/jeux', '/jeux/HéritierMillionaire', '/contact', '/creations', '/booking', '/logements'];

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
  ];
}
