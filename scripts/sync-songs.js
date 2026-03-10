const {
  MAPPING_FILE,
  SONGS_FILE,
  buildSpotifyTrackUrl,
  dedupeBy,
  extractSpotifyTrackId,
  loadJson,
  normalizeTitle,
  saveJson,
  slugify,
  sortByPublishedAtDesc,
} = require('./song-sync-utils');
const { fetchYouTubeSongs } = require('./sync-youtube');
const { fetchSpotifySongs } = require('./sync-spotify');

function buildUniqueSongSlug(song, slugCounts) {
  const baseSlug = (song.slug || slugify(song.title || '')).trim() || 'chanson';
  const currentCount = slugCounts.get(baseSlug) || 0;

  if (currentCount === 0) {
    slugCounts.set(baseSlug, 1);
    return baseSlug;
  }

  const uniqueSource = song.youtubeVideoId || song.spotifyTrackId || song.id || `${currentCount + 1}`;
  const uniqueSuffix = uniqueSource.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(-6) || `${currentCount + 1}`;
  const uniqueSlug = `${baseSlug}-${uniqueSuffix}`;

  slugCounts.set(baseSlug, currentCount + 1);
  return uniqueSlug;
}

function getDefaultMapping() {
  return {
    youtubeToSpotify: {},
    ignoredYouTubeVideoIds: [],
    ignoredSpotifyTrackIds: [],
  };
}

function sanitizeSong(song, existingSong) {
  const title = (song.title || existingSong?.title || '').trim();
  const slug = (song.slug || existingSong?.slug || slugify(title)).trim();
  const youtubeVideoId = song.youtubeVideoId || existingSong?.youtubeVideoId || '';
  const spotifyTrackId = song.spotifyTrackId || existingSong?.spotifyTrackId || extractSpotifyTrackId(song.spotifyUrl || existingSong?.spotifyUrl || '');
  const youtubeUrl = song.youtubeUrl || existingSong?.youtubeUrl || '';
  const spotifyUrl = song.spotifyUrl || existingSong?.spotifyUrl || (spotifyTrackId ? buildSpotifyTrackUrl(spotifyTrackId) : '');
  const description = typeof song.description === 'string' ? song.description.trim() : (existingSong?.description || '');
  const coverImage = song.coverImage || existingSong?.coverImage || '';
  const publishedAt = song.publishedAt || existingSong?.publishedAt || null;
  const source = youtubeUrl && spotifyUrl ? 'both' : youtubeUrl ? 'youtube' : 'spotify';
  const status = song.status || existingSong?.status || 'published';

  return {
    id: song.id || existingSong?.id || (youtubeVideoId ? `youtube:${youtubeVideoId}` : `spotify:${spotifyTrackId}`),
    title,
    slug,
    youtubeUrl,
    youtubeVideoId,
    spotifyUrl,
    spotifyTrackId,
    coverImage,
    publishedAt,
    source,
    description,
    status,
  };
}

function buildExistingIndexes(existingSongs) {
  return {
    byYoutubeVideoId: new Map(existingSongs.filter((song) => song.youtubeVideoId).map((song) => [song.youtubeVideoId, song])),
    bySpotifyTrackId: new Map(existingSongs.filter((song) => song.spotifyTrackId).map((song) => [song.spotifyTrackId, song])),
    byNormalizedTitle: new Map(existingSongs.map((song) => [normalizeTitle(song.title), song])),
  };
}

function findExistingSong(indexes, { youtubeVideoId, spotifyTrackId, title }) {
  return (
    (youtubeVideoId ? indexes.byYoutubeVideoId.get(youtubeVideoId) : undefined) ||
    (spotifyTrackId ? indexes.bySpotifyTrackId.get(spotifyTrackId) : undefined) ||
    indexes.byNormalizedTitle.get(normalizeTitle(title))
  );
}

async function syncSongs() {
  const mapping = await loadJson(MAPPING_FILE, getDefaultMapping());
  const existingFile = await loadJson(SONGS_FILE, { syncedAt: null, songs: [] });
  const existingSongs = Array.isArray(existingFile.songs) ? existingFile.songs : [];
  const indexes = buildExistingIndexes(existingSongs);

  const [youtubeSongs, spotifySongs] = await Promise.all([fetchYouTubeSongs(), fetchSpotifySongs()]);

  const ignoredYouTube = new Set(mapping.ignoredYouTubeVideoIds || []);
  const ignoredSpotify = new Set(mapping.ignoredSpotifyTrackIds || []);
  const spotifyById = new Map(spotifySongs.map((song) => [song.spotifyTrackId, song]));
  const spotifyByNormalizedTitle = new Map();

  for (const spotifySong of spotifySongs) {
    if (ignoredSpotify.has(spotifySong.spotifyTrackId)) continue;
    const key = normalizeTitle(spotifySong.title);
    const group = spotifyByNormalizedTitle.get(key) || [];
    group.push(spotifySong);
    spotifyByNormalizedTitle.set(key, group);
  }

  const matchedSpotifyTrackIds = new Set();
  const mergedSongs = [];

  for (const youtubeSong of youtubeSongs) {
    if (!youtubeSong.youtubeVideoId || ignoredYouTube.has(youtubeSong.youtubeVideoId)) {
      continue;
    }

    let matchedSpotifySong = null;
    let status = 'published';
    const manualMappingValue = Object.prototype.hasOwnProperty.call(mapping.youtubeToSpotify || {}, youtubeSong.youtubeVideoId)
      ? mapping.youtubeToSpotify[youtubeSong.youtubeVideoId]
      : undefined;

    if (manualMappingValue === null) {
      matchedSpotifySong = null;
    } else if (typeof manualMappingValue === 'string' && manualMappingValue.trim()) {
      matchedSpotifySong = spotifyById.get(manualMappingValue.trim()) || null;
      if (!matchedSpotifySong) {
        status = 'manual-review';
      }
    } else {
      const candidates = spotifyByNormalizedTitle.get(normalizeTitle(youtubeSong.title)) || [];
      const uniqueCandidates = dedupeBy(candidates, (candidate) => candidate.spotifyTrackId);

      if (uniqueCandidates.length === 1) {
        matchedSpotifySong = uniqueCandidates[0];
      } else if (uniqueCandidates.length > 1) {
        status = 'manual-review';
      }
    }

    if (matchedSpotifySong?.spotifyTrackId) {
      matchedSpotifyTrackIds.add(matchedSpotifySong.spotifyTrackId);
    }

    const existingSong = findExistingSong(indexes, {
      youtubeVideoId: youtubeSong.youtubeVideoId,
      spotifyTrackId: matchedSpotifySong?.spotifyTrackId,
      title: youtubeSong.title,
    });

    mergedSongs.push(
      sanitizeSong(
        {
          ...youtubeSong,
          spotifyUrl: matchedSpotifySong?.spotifyUrl || '',
          spotifyTrackId: matchedSpotifySong?.spotifyTrackId || '',
          coverImage: youtubeSong.coverImage || matchedSpotifySong?.coverImage || '',
          publishedAt: youtubeSong.publishedAt || matchedSpotifySong?.publishedAt || null,
          status,
        },
        existingSong,
      ),
    );
  }

  for (const spotifySong of spotifySongs) {
    if (!spotifySong.spotifyTrackId || ignoredSpotify.has(spotifySong.spotifyTrackId) || matchedSpotifyTrackIds.has(spotifySong.spotifyTrackId)) {
      continue;
    }

    const existingSong = findExistingSong(indexes, {
      youtubeVideoId: '',
      spotifyTrackId: spotifySong.spotifyTrackId,
      title: spotifySong.title,
    });

    mergedSongs.push(sanitizeSong(spotifySong, existingSong));
  }

  const songs = sortByPublishedAtDesc(
    dedupeBy(mergedSongs, (song) => song.youtubeVideoId || song.spotifyTrackId || song.slug).map((song) => sanitizeSong(song)),
  );
  const slugCounts = new Map();
  const songsWithUniqueSlugs = songs.map((song) => ({
    ...song,
    slug: buildUniqueSongSlug(song, slugCounts),
  }));

  const payload = {
    syncedAt: new Date().toISOString(),
    songs: songsWithUniqueSlugs,
  };

  await saveJson(SONGS_FILE, payload);

  return payload;
}

async function main() {
  const result = await syncSongs();
  console.log(`Synchronisation terminée : ${result.songs.length} chanson(s) sauvegardée(s) dans data/songs.json.`);
  console.log(`Dernière sync : ${result.syncedAt}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  syncSongs,
};
