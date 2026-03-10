import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nowis.store';

export function buildMetadata({
  title,
  description,
  path = '/',
  image = '/hero.jpg',
  keywords = [],
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Nowis Morin',
      locale: 'fr_CA',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}

export function extractSpotifyTrackId(url?: string): string | null {
  if (!url) return null;

  if (/^[A-Za-z0-9]{22}$/.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/track\/([A-Za-z0-9]{22})/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(url?: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault') {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}
