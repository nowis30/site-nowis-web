import snapshot from '../../data/youtube-selections.json';
import type { Song } from './songs';

export const youtubeSelectionSnapshot = snapshot;

export function getYouTubeSelections(songs: Song[]) {
  const byId = new Map(songs.filter((song) => song.youtubeVideoId).map((song) => [song.youtubeVideoId, song]));
  const resolve = (items: typeof snapshot.latest) => items.flatMap((item) => {
    const song = byId.get(item.videoId);
    return song ? [{ song, viewCount: item.viewCount }] : [];
  });
  return { latest: resolve(snapshot.latest), popular: resolve(snapshot.popular) };
}
