import store from '@/data/music-store.json';

export const featuredAlbum = store.album;
const links: Record<string, { title: string; url: string; album: string }> = store.radioLinks;
export function musicStoreLink(trackId: string) {
  if (trackId.startsWith('album-')) {
    const track = featuredAlbum.tracks.find(track => `album-${track.id}` === trackId);
    return track ? { title: track.title, url: track.url, album: featuredAlbum.title } : null;
  }
  return links[trackId] ?? null;
}
export function itunesUrl(url: string) {
  const target = new URL(url);
  target.searchParams.set('app', 'itunes');
  return target.toString();
}
