const {
  buildSpotifyTrackUrl,
  dedupeBy,
  normalizeText,
  normalizeTitle,
  slugify,
} = require('./song-sync-utils');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify API ${response.status} (${url}): ${body}`);
  }

  return response.json();
}

async function getSpotifyAccessToken({ clientId = process.env.SPOTIFY_CLIENT_ID, clientSecret = process.env.SPOTIFY_CLIENT_SECRET } = {}) {
  if (!clientId) {
    throw new Error('SPOTIFY_CLIENT_ID est manquant.');
  }

  if (!clientSecret) {
    throw new Error('SPOTIFY_CLIENT_SECRET est manquant.');
  }

  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify auth ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchAllPages(url, accessToken, selector) {
  const items = [];
  let nextUrl = url;

  while (nextUrl) {
    const data = await fetchJson(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const page = selector(data);
    items.push(...(page.items || []));
    nextUrl = page.next || null;
  }

  return items;
}

async function resolveArtistId(accessToken, artistName = 'Nowis Morin') {
  if (process.env.SPOTIFY_ARTIST_ID) {
    return process.env.SPOTIFY_ARTIST_ID;
  }

  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', artistName);
  url.searchParams.set('type', 'artist');
  url.searchParams.set('limit', '10');

  const data = await fetchJson(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const exactMatches = (data.artists?.items || []).filter((artist) => normalizeText(artist.name) === normalizeText(artistName));

  if (exactMatches.length === 1) {
    return exactMatches[0].id;
  }

  if (exactMatches.length > 1) {
    throw new Error('Plusieurs artistes Spotify portent ce nom. Ajoute SPOTIFY_ARTIST_ID pour lever l’ambiguïté.');
  }

  throw new Error('Artiste Spotify introuvable. Vérifie le nom ou ajoute SPOTIFY_ARTIST_ID.');
}

async function fetchSpotifySongs({
  clientId = process.env.SPOTIFY_CLIENT_ID,
  clientSecret = process.env.SPOTIFY_CLIENT_SECRET,
  artistName = 'Nowis Morin',
} = {}) {
  const accessToken = await getSpotifyAccessToken({ clientId, clientSecret });
  const artistId = await resolveArtistId(accessToken, artistName);

  const albumsUrl = new URL(`https://api.spotify.com/v1/artists/${artistId}/albums`);
  albumsUrl.searchParams.set('include_groups', 'album,single');
  albumsUrl.searchParams.set('market', 'CA');

  const albums = await fetchAllPages(albumsUrl.toString(), accessToken, (data) => data);
  const uniqueAlbums = dedupeBy(albums, (album) => album.id);
  const tracks = [];

  for (const album of uniqueAlbums) {
    const albumTracksUrl = new URL(`https://api.spotify.com/v1/albums/${album.id}/tracks`);
    albumTracksUrl.searchParams.set('market', 'CA');

    const albumTracks = await fetchAllPages(albumTracksUrl.toString(), accessToken, (data) => data);

    for (const track of albumTracks) {
      const isArtistTrack = (track.artists || []).some((artist) => artist.id === artistId || normalizeText(artist.name) === normalizeText(artistName));
      if (!isArtistTrack) continue;

      tracks.push({
        id: `spotify:${track.id}`,
        title: track.name,
        slug: slugify(track.name),
        youtubeUrl: '',
        youtubeVideoId: '',
        spotifyUrl: track.external_urls?.spotify || buildSpotifyTrackUrl(track.id),
        spotifyTrackId: track.id,
        coverImage: album.images?.[0]?.url || '',
        publishedAt: album.release_date || null,
        source: 'spotify',
        description: '',
        status: 'published',
        normalizedTitle: normalizeTitle(track.name),
      });
    }
  }

  return dedupeBy(tracks, (track) => track.spotifyTrackId);
}

async function main() {
  const songs = await fetchSpotifySongs();
  console.log(`Spotify: ${songs.length} morceau(x) récupéré(s).`);
  console.log(JSON.stringify(songs.slice(0, 5), null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  fetchSpotifySongs,
};
