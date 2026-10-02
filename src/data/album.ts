import { featuredAlbum, itunesUrl } from '@/lib/music-store';

/** Release information and official store order, shared by the album page and promotion. */
export const albumRelease = {
  title: 'L’amour de Nowis',
  artist: 'Nowis Morin',
  creator: 'Simon Morin',
  releasedAt: '2026-09-29',
  releaseDateLabel: '29 septembre 2026',
  path: '/album',
  cover: featuredAlbum.cover,
  spotifyUrl: 'https://open.spotify.com/album/4DCAgBOuSE3OVuGg3dceLj',
  appleMusicUrl: featuredAlbum.url,
  itunesUrl: itunesUrl(featuredAlbum.url),
  youtubeMusicUrl: 'https://music.youtube.com/playlist?list=OLAK5uy_lteI3qV7-W8aRYwBkBPAcHFTtTAljrUwg',
  amazonMusicUrl: 'https://music.amazon.ca/albums/B0HLDJY7KF',
  deezerUrl: 'https://www.deezer.com/album/1109103312',
  tidalUrl: 'https://tidal.com/album/565203711',
  boomplayUrl: 'https://www.boomplay.com/albums/EQUHPj3hHkftBc8ZFmzIlqcJ?from=search',
  anghamiUrl: 'https://play.anghami.com/album/1101198489',
} as const;

/** Official album destinations; Anghami's regional restriction is shown separately. */
export const albumPlatforms = [
  { name: 'Spotify', url: albumRelease.spotifyUrl, action: 'listen' },
  { name: 'Apple Music', url: albumRelease.appleMusicUrl, action: 'listen' },
  { name: 'iTunes Store', url: albumRelease.itunesUrl, action: 'purchase' },
  { name: 'YouTube Music', url: albumRelease.youtubeMusicUrl, action: 'listen' },
  { name: 'Amazon Music', url: albumRelease.amazonMusicUrl, action: 'listen' },
  { name: 'Deezer', url: albumRelease.deezerUrl, action: 'listen' },
  { name: 'Tidal', url: albumRelease.tidalUrl, action: 'listen' },
  { name: 'Boomplay', url: albumRelease.boomplayUrl, action: 'listen' },
  { name: 'Anghami', url: albumRelease.anghamiUrl, action: 'regional' },
] as const;

/** These are artist profiles, not a claim that this release is already listed. */
export const artistPlatforms = [
  { name: 'Qobuz', url: 'https://www.qobuz.com/ca-en/interpreter/nowis-morin/29684176' },
] as const;

export const albumTracks = featuredAlbum.tracks.map((track, index) => ({
  id: `album-${track.id}`,
  number: index + 1,
  title: track.title,
  appleMusicUrl: track.url,
  itunesUrl: itunesUrl(track.url),
}));

export const nounoursTrack = {
  id: 'album-6817287629',
  title: 'Le gros nounours',
  spotifyUrl: 'https://open.spotify.com/track/2PbCoBVMPryBkFrZTvcIH8',
} as const;

// These names come from the distributor submission list supplied by the artist.
// A submission is not evidence of a live release, and icon URLs are not listening links.
export const announcedDistribution = [
  'Instagram / Facebook', 'TikTok et ByteDance',
  'Pandora', 'iHeartRadio', 'Qobuz', 'JioSaavn',
  'NetEase', 'Tencent', 'MassiveMusic', 'Claro Música', 'Joox',
  'Kuack Media', 'Adaptr', 'Flo', 'MediaNet', 'Snapchat',
] as const;
