import fs from 'node:fs/promises';
import path from 'node:path';
import { extractSpotifyTrackId, extractYouTubeVideoId, getYouTubeThumbnailUrl } from '@/lib/seo';

export type SongSource = 'youtube' | 'spotify' | 'both';
export type SongStatus = 'published' | 'manual-review' | 'hidden';

export type SongRecord = {
  id: string;
  title: string;
  slug: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  spotifyUrl?: string;
  spotifyTrackId?: string;
  coverImage: string;
  publishedAt?: string | null;
  source: SongSource;
  description?: string;
  status: SongStatus;
  notes?: string;
  otherStreamUrl?: string;
};

export type Song = SongRecord & {
  image: string;
  shortDescription: string;
  longDescription: string;
  creationMethod: string;
  mood: string;
  seoTags: string[];
  featured?: boolean;
};

type SongsFile = {
  syncedAt?: string | null;
  songs?: SongRecord[];
};

type RawSong = {
  title: string;
  slug: string;
  youtubeUrl: string;
  spotifyUrl: string;
  otherStreamUrl: string;
  description: string;
  creation: string;
  mood: string;
  notes: string;
};

const songsFilePath = path.join(process.cwd(), 'data', 'songs.json');
const baseSeoTags = ['Nowis Morin', 'Nowis Morin chanson', 'musique Nowis Morin', 'chanson IA Québec', 'artiste musique IA Québec'];

function buildUniqueSongSlug(song: Pick<SongRecord, 'slug' | 'title' | 'youtubeVideoId' | 'spotifyTrackId' | 'id'>, slugCounts: Map<string, number>) {
  const baseSlug = song.slug || slugify(song.title) || 'chanson';
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

const rawSongs: RawSong[] = [
  {
    title: 'Ta beauté',
    slug: 'ta-beaute',
    youtubeUrl: 'https://www.youtube.com/watch?v=VbcHV4K72-Q',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson d’amour qui met de l’avant la beauté intérieure et extérieure. Le texte cherche à transmettre une émotion directe, simple et sincère.',
    creation:
      'Créée dans mon univers musical avec l’aide de l’intelligence artificielle, puis retravaillée pour garder une couleur humaine et personnelle.',
    mood: 'Romantique, sensible et sincère, avec une émotion douce qui va droit au cœur.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
  {
    title: 'Seul',
    slug: 'seul',
    youtubeUrl: 'https://www.youtube.com/watch?v=AASrsBlA8gs',
    spotifyUrl: 'https://open.spotify.com/intl-fr/track/1sKPApGQFanZRGvp6QK8oq?si=a233bacde8484bcb',
    otherStreamUrl: 'https://play.anghami.com/song/1261003281',
    description:
      'Une chanson sur la solitude, le vide, et les moments où l’on se retrouve face à soi-même. L’ambiance est plus introspective et chargée d’émotion.',
    creation:
      'Pensée comme une chanson qui laisse respirer l’émotion, avec une approche assistée par l’IA pour la base musicale et l’atmosphère.',
    mood: 'Introspective, mélancolique et chargée d’une émotion retenue.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Tout croche',
    slug: 'tout-croche',
    youtubeUrl: 'https://www.youtube.com/watch?v=r3adrq0ibh0',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson qui parle des périodes où tout semble aller de travers. Elle reflète le désordre intérieur, les doutes et le besoin de continuer malgré tout.',
    creation:
      'Création musicale développée avec l’IA, puis orientée pour garder un ton personnel, brut et vrai.',
    mood: 'Brute, vraie et traversée par le doute, mais portée par l’envie de continuer.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
  {
    title: 'On n\'aime l\'argent',
    slug: 'on-naime-largent',
    youtubeUrl: 'https://www.youtube.com/watch?v=hvyftoI3CSA',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1261003276',
    description:
      'Une chanson plus énergique, tournée vers l’ambition, la motivation et l’envie de bâtir quelque chose de plus grand.',
    creation:
      'Conçue comme une pièce plus directe et accrocheuse, avec une base générée par IA puis ajustée pour donner un ton assumé.',
    mood: 'Énergique, ambitieuse et assumée, avec une vibe directe et motivante.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Marie-Lisa',
    slug: 'marie-lisa',
    youtubeUrl: 'https://www.youtube.com/watch?v=sdm_1uu_2Ew',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1261003287',
    description:
      'Une chanson centrée sur une personne, un prénom, une présence. Le ton est plus narratif et affectif.',
    creation:
      'Développée dans une approche de chanson personnalisée, avec appui de l’IA pour la structure musicale et l’ambiance.',
    mood: 'Narrative, affective et douce, avec une présence très humaine.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Le printemps va rougir',
    slug: 'le-printemps-va-rougir',
    youtubeUrl: '',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1261003282',
    description:
      'Une chanson avec une image forte et poétique, qui joue sur les saisons, le changement et l’intensité des émotions.',
    creation:
      'Pensée pour créer une ambiance imagée et marquante, avec une base musicale soutenue par l’intelligence artificielle.',
    mood: 'Poétique, imagée et intense, avec une sensation de transformation.',
    notes: 'Lien Anghami vérifié. Ajouter le vrai lien YouTube si tu veux l’afficher sur le site.',
  },
  {
    title: 'On est la pour toi',
    slug: 'on-est-la-pour-toi',
    youtubeUrl: 'https://www.youtube.com/watch?v=GMns6tMpZr4',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1261003279',
    description:
      'Une chanson de soutien, de présence et de solidarité. Le message principal est simple : être là quand quelqu’un en a besoin.',
    creation:
      'Créée dans un esprit humain et réconfortant, avec une composition assistée par IA puis adaptée pour garder une vraie chaleur.',
    mood: 'Réconfortante, solidaire et chaleureuse, pensée pour rassurer.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Roule roule',
    slug: 'roule-roule',
    youtubeUrl: 'https://www.youtube.com/watch?v=VzCmpbQSewo',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1261003280',
    description:
      'Une chanson qui évoque le mouvement, la route et le besoin d’avancer. L’énergie du morceau rappelle l’appel du large et de la liberté.',
    creation:
      'Construite autour d’une vibe plus entraînante, avec une base soutenue par l’IA et une intention plus visuelle.',
    mood: 'Entraînante, libre et tournée vers l’élan, la route et le mouvement.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Systeme de la santé',
    slug: 'systeme-de-la-sante',
    youtubeUrl: 'https://www.youtube.com/watch?v=p40FTNPmQcc',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1248612632',
    description:
      'Une chanson plus engagée qui parle du système de la santé et des difficultés vécues sur le terrain. Le morceau sert aussi de prise de parole.',
    creation:
      'Le projet a été monté dans une logique de chanson à message, avec une structure soutenue par l’IA mais orientée vers un propos social clair.',
    mood: 'Engagée, lucide et portée par une volonté de prise de parole sociale.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'la semaine est longue',
    slug: 'la-semaine-est-longue',
    youtubeUrl: 'https://www.youtube.com/watch?v=BlF57JlrNpk',
    spotifyUrl: '',
    otherStreamUrl: 'https://play.anghami.com/song/1245591281',
    description:
      'Une chanson sur la fatigue, le quotidien, et ce sentiment universel où la semaine s’étire plus qu’elle devrait.',
    creation:
      'Créée dans un style plus accessible et quotidien, avec une approche IA pour la musique et une touche personnelle dans l’intention.',
    mood: 'Accessible, quotidienne et fatiguée juste ce qu’il faut pour sonner vrai.',
    notes: 'YouTube vérifié + lien Anghami vérifié. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Bon dieu',
    slug: 'bon-dieu',
    youtubeUrl: 'https://www.youtube.com/watch?v=rBAe34mfXLg',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson plus intime qui touche à la peine, au départ et au manque. Le ton est plus vulnérable et intérieur.',
    creation:
      'Pensée comme une pièce émotionnelle, avec une composition soutenue par l’IA et une intention très personnelle.',
    mood: 'Intime, vulnérable et intérieure, avec une forte charge émotionnelle.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
  {
    title: 'La vie est compliquer',
    slug: 'la-vie-est-compliquer',
    youtubeUrl: 'https://www.youtube.com/watch?v=pNOI7Y1tPWc',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson sur les complications de la vie, les obstacles et les émotions qui s’accumulent quand rien ne semble simple.',
    creation:
      'Développée pour garder une impression de vécu réel, avec l’IA comme outil de création et de mise en forme musicale.',
    mood: 'Réaliste, chargée et humaine, avec une sensation de vécu accumulé.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
  {
    title: 'Superbowl',
    slug: 'superbowl',
    youtubeUrl: 'https://www.youtube.com/watch?v=gtyzpP5OkhM',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson plus amusante et festive, inspirée de l’ambiance du Super Bowl, avec une touche légère et assumée.',
    creation:
      'Création pensée pour l’énergie et le divertissement, avec l’IA utilisée comme moteur d’inspiration musicale.',
    mood: 'Festive, légère et divertissante, avec une énergie assumée.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
  {
    title: 'La famille Morin',
    slug: 'la-famille-morin',
    youtubeUrl: 'https://www.youtube.com/watch?v=roZeIZRELX0',
    spotifyUrl: '',
    otherStreamUrl: 'https://distrokid.com/hyperfollow/nowismorin/la-famille-morin',
    description:
      'Une chanson familiale qui met en lumière les liens, les souvenirs et l’identité de la famille Morin.',
    creation:
      'Pensée comme une chanson rassembleuse, avec une touche personnelle très forte et une structure musicale soutenue par l’IA.',
    mood: 'Familiale, rassembleuse et identitaire, portée par les souvenirs et les liens.',
    notes: 'YouTube vérifié + page DistroKid HyperFollow vérifiée. Ajouter le vrai lien Spotify individuel si tu l’as.',
  },
  {
    title: 'Un père et sa fille',
    slug: 'un-pere-et-sa-fille',
    youtubeUrl: 'https://www.youtube.com/watch?v=eltNJj1h_1s',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson sur le lien père-fille, la tendresse, la présence et l’amour qui traverse le temps.',
    creation:
      'Créée dans une approche plus émotive et familiale, avec l’IA comme outil pour soutenir la composition.',
    mood: 'Tendre, familiale et profondément affective.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
  {
    title: 'Merci la vie',
    slug: 'merci-la-vie',
    youtubeUrl: 'https://www.youtube.com/watch?v=CmlWWJ_n72E',
    spotifyUrl: '',
    otherStreamUrl: 'https://distrokid.com/hyperfollow/simonnowismorin/freerider',
    description:
      'Une chanson qui penche du côté de la gratitude, de la reconnaissance et du regard posé sur ce que la vie apporte malgré les difficultés.',
    creation:
      'Conçue pour laisser une impression plus lumineuse, avec une base musicale soutenue par l’IA.',
    mood: 'Lumineuse, reconnaissante et tournée vers la gratitude.',
    notes:
      'Lien YouTube vérifié. La page DistroKid de l’album FreeRider est vérifiée, mais pas un lien Spotify individuel confirmé ici.',
  },
  {
    title: 'Je prends mon temps',
    slug: 'je-prends-mon-temps',
    youtubeUrl: 'https://www.youtube.com/watch?v=goZqtKW393M',
    spotifyUrl: '',
    otherStreamUrl: '',
    description:
      'Une chanson qui parle du rythme, du recul et du besoin de ne pas toujours courir après tout.',
    creation:
      'Créée avec une approche plus posée, où l’IA a servi de soutien pour la base musicale et l’ambiance globale.',
    mood: 'Posée, calme et réfléchie, avec un vrai sentiment de recul.',
    notes: 'Lien YouTube vérifié. Ajouter le vrai lien Spotify individuel si disponible.',
  },
];

const legacySongs: SongRecord[] = rawSongs.map((song) => ({
  id: song.youtubeUrl ? `youtube:${extractYouTubeVideoId(song.youtubeUrl) ?? song.slug}` : `legacy:${song.slug}`,
  title: song.title,
  slug: song.slug,
  youtubeUrl: song.youtubeUrl || undefined,
  youtubeVideoId: extractYouTubeVideoId(song.youtubeUrl) || undefined,
  spotifyUrl: song.spotifyUrl || undefined,
  spotifyTrackId: extractSpotifyTrackId(song.spotifyUrl) || undefined,
  coverImage: getYouTubeThumbnailUrl(song.youtubeUrl, 'hqdefault') || '/hero.jpg',
  publishedAt: null,
  source: song.youtubeUrl && song.spotifyUrl ? 'both' : song.youtubeUrl ? 'youtube' : 'spotify',
  description: song.description,
  status: 'published',
  notes: song.notes,
  otherStreamUrl: song.otherStreamUrl || undefined,
}));

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeSongRecord(song: SongRecord): SongRecord {
  const youtubeVideoId = song.youtubeVideoId || extractYouTubeVideoId(song.youtubeUrl) || undefined;
  const spotifyTrackId = song.spotifyTrackId || extractSpotifyTrackId(song.spotifyUrl) || undefined;
  const youtubeUrl = song.youtubeUrl || (youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : undefined);
  const spotifyUrl = song.spotifyUrl || (spotifyTrackId ? `https://open.spotify.com/track/${spotifyTrackId}` : undefined);
  const coverImage = song.coverImage || getYouTubeThumbnailUrl(youtubeUrl, 'hqdefault') || '/hero.jpg';
  const source: SongSource = youtubeUrl && spotifyUrl ? 'both' : youtubeUrl ? 'youtube' : 'spotify';

  return {
    id: song.id || (youtubeVideoId ? `youtube:${youtubeVideoId}` : spotifyTrackId ? `spotify:${spotifyTrackId}` : `song:${song.slug || slugify(song.title)}`),
    title: song.title,
    slug: song.slug || slugify(song.title),
    youtubeUrl,
    youtubeVideoId,
    spotifyUrl,
    spotifyTrackId,
    coverImage,
    publishedAt: song.publishedAt || null,
    source,
    description: song.description?.trim() || '',
    status: song.status || 'published',
    notes: song.notes,
    otherStreamUrl: song.otherStreamUrl,
  };
}

function mapSongForUi(song: SongRecord, index: number): Song {
  return {
    ...song,
    image: song.coverImage || '/hero.jpg',
    shortDescription: song.description || '',
    longDescription: song.description || '',
    creationMethod: song.description || '',
    mood: '',
    seoTags: [...baseSeoTags, song.title],
    featured: index < 3,
  };
}

function sortSongs(songs: SongRecord[]) {
  return [...songs].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return a.title.localeCompare(b.title, 'fr');
  });
}

function ensureUniqueSlugs(songs: SongRecord[]): SongRecord[] {
  const slugCounts = new Map<string, number>();

  return songs.map((song) => ({
    ...song,
    slug: buildUniqueSongSlug(song, slugCounts),
  }));
}

async function readSongsFile(): Promise<SongRecord[]> {
  try {
    const raw = await fs.readFile(songsFilePath, 'utf8');
    const parsed = JSON.parse(raw) as SongsFile;
    if (!Array.isArray(parsed.songs) || parsed.songs.length === 0) {
      return [];
    }

    return parsed.songs.map(normalizeSongRecord);
  } catch {
    return [];
  }
}

export async function getAllSongs(): Promise<Song[]> {
  const syncedSongs = await readSongsFile();
  const sourceSongs = syncedSongs.length > 0 ? syncedSongs : legacySongs;

  return ensureUniqueSlugs(sortSongs(sourceSongs.filter((song) => song.status !== 'hidden'))).map(mapSongForUi);
}

export async function getFeaturedSongs(limit = 3): Promise<Song[]> {
  return (await getAllSongs()).slice(0, limit);
}

export async function getSongBySlug(slug: string): Promise<Song | undefined> {
  return (await getAllSongs()).find((song) => song.slug === slug);
}
