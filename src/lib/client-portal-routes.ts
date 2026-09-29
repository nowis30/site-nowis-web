export const SONG_REQUEST_NEXT_PATH = '/client/song-requests/nouveau';
export const SONG_REQUEST_GOOGLE_AUTH_URL = `/api/client-auth/google/start?next=${encodeURIComponent(SONG_REQUEST_NEXT_PATH)}`;

export const WORKSHOP_REQUEST_NEXT_PATH = '/client/workshops/nouveau';
export const WORKSHOP_REQUEST_GOOGLE_AUTH_URL = `/api/client-auth/google/start?next=${encodeURIComponent(WORKSHOP_REQUEST_NEXT_PATH)}`;
export const SONG_REQUEST_PUBLIC_PATH = '/commander-une-chanson#demande';

/** Preserve old CMS links while sending first-time inquiries to the public form. */
export function publicInquiryHref(href: string): string {
  try {
    const url = new URL(href, 'https://nowis.store');
    if (url.origin !== 'https://nowis.store' || url.pathname !== '/api/client-auth/google/start') return href;
    const next = new URL(url.searchParams.get('next') || '/', url.origin);
    if (next.origin !== url.origin) return href;
    if (next.pathname === SONG_REQUEST_NEXT_PATH) return SONG_REQUEST_PUBLIC_PATH;
    if (next.pathname === WORKSHOP_REQUEST_NEXT_PATH) {
      const groupType = next.searchParams.get('groupType');
      return `/ateliers/demande${groupType ? `?groupType=${encodeURIComponent(groupType)}` : ''}`;
    }
  } catch { /* Keep unrelated CMS links unchanged. */ }
  return href;
}
