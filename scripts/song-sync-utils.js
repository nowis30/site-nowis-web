const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SONGS_FILE = path.join(DATA_DIR, 'songs.json');
const MAPPING_FILE = path.join(DATA_DIR, 'song-mapping.json');

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env'];

  for (const fileName of envFiles) {
    const filePath = path.join(ROOT_DIR, fileName);

    try {
      const raw = require('node:fs').readFileSync(filePath, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // fichier absent: on continue
    }
  }
}

loadLocalEnv();

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function cleanupSongTitle(title = '') {
  return normalizeText(title)
    .replace(/\bnowis morin\b/g, ' ')
    .replace(/\b(official|officiel|video|audio|clip|lyrics|lyric|paroles|visualizer|teaser|shorts?)\b/g, ' ')
    .replace(/\b(ft|feat|featuring)\b/g, ' ')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(title = '') {
  return cleanupSongTitle(title);
}

function slugify(value = '') {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function extractYouTubeVideoId(url = '') {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace(/^\//, '');
    }

    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }

  return '';
}

function buildYouTubeUrl(videoId) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
}

function getYouTubeThumbnailFromThumbnails(thumbnails = {}) {
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ''
  );
}

function getYouTubeThumbnailFromId(videoId) {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
}

function extractSpotifyTrackId(input = '') {
  if (!input) return '';

  if (/^[A-Za-z0-9]{22}$/.test(input)) {
    return input;
  }

  try {
    const parsed = new URL(input);
    const match = parsed.pathname.match(/\/track\/([A-Za-z0-9]{22})/);
    return match?.[1] || '';
  } catch {
    return '';
  }
}

function buildSpotifyTrackUrl(trackId) {
  return trackId ? `https://open.spotify.com/track/${trackId}` : '';
}

async function loadJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function saveJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sortByPublishedAtDesc(items) {
  return [...items].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return (a.title || '').localeCompare(b.title || '', 'fr');
  });
}

function dedupeBy(items, getKey) {
  const map = new Map();

  for (const item of items) {
    const key = getKey(item);
    if (!key || map.has(key)) continue;
    map.set(key, item);
  }

  return [...map.values()];
}

module.exports = {
  DATA_DIR,
  SONGS_FILE,
  MAPPING_FILE,
  buildSpotifyTrackUrl,
  buildYouTubeUrl,
  cleanupSongTitle,
  dedupeBy,
  extractSpotifyTrackId,
  extractYouTubeVideoId,
  getYouTubeThumbnailFromId,
  getYouTubeThumbnailFromThumbnails,
  loadJson,
  loadLocalEnv,
  normalizeText,
  normalizeTitle,
  saveJson,
  slugify,
  sortByPublishedAtDesc,
};
