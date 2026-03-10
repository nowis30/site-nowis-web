const {
  buildYouTubeUrl,
  getYouTubeThumbnailFromId,
  getYouTubeThumbnailFromThumbnails,
  normalizeTitle,
  slugify,
} = require('./song-sync-utils');

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube API ${response.status}: ${body}`);
  }

  return response.json();
}

async function getUploadsPlaylistId({ apiKey, channelId }) {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', apiKey);

  const data = await fetchJson(url.toString());
  const uploadsPlaylistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error('Impossible de récupérer la playlist d’uploads YouTube. Vérifie YOUTUBE_CHANNEL_ID.');
  }

  return uploadsPlaylistId;
}

async function fetchYouTubeSongs({ apiKey = process.env.YOUTUBE_API_KEY, channelId = process.env.YOUTUBE_CHANNEL_ID } = {}) {
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY est manquante.');
  }

  if (!channelId) {
    throw new Error('YOUTUBE_CHANNEL_ID est manquant.');
  }

  const uploadsPlaylistId = await getUploadsPlaylistId({ apiKey, channelId });
  const items = [];
  let pageToken = '';

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails,status');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);

    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const data = await fetchJson(url.toString());
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return items
    .filter((item) => item?.snippet?.resourceId?.videoId)
    .filter((item) => item?.snippet?.title && item.snippet.title !== 'Deleted video' && item.snippet.title !== 'Private video')
    .map((item) => {
      const videoId = item.snippet.resourceId.videoId;
      const title = item.snippet.title.trim();
      const description = (item.snippet.description || '').trim();

      return {
        id: `youtube:${videoId}`,
        title,
        slug: slugify(title),
        youtubeUrl: buildYouTubeUrl(videoId),
        youtubeVideoId: videoId,
        spotifyUrl: '',
        spotifyTrackId: '',
        coverImage: getYouTubeThumbnailFromThumbnails(item.snippet.thumbnails) || getYouTubeThumbnailFromId(videoId),
        publishedAt: item.contentDetails?.videoPublishedAt || item.snippet.publishedAt || null,
        source: 'youtube',
        description,
        status: 'published',
        normalizedTitle: normalizeTitle(title),
      };
    });
}

async function main() {
  const songs = await fetchYouTubeSongs();
  console.log(`YouTube: ${songs.length} vidéo(s) récupérée(s).`);
  console.log(JSON.stringify(songs.slice(0, 5), null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  fetchYouTubeSongs,
};
