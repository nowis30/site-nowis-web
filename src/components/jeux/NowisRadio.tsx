'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Pause, Play, Radio, SkipForward, Volume2 } from 'lucide-react';

type PlaylistItem = {
  title: string;
  src: string;
};

const audioBaseUrl = '/audio/nowis-radio';

const playlistUrl = `${audioBaseUrl}/playlist.json`;

function toProxyAudioSrc(src: string) {
  const rawFileName = src.split('/').pop();

  if (!rawFileName) {
    return src;
  }

  let decodedFileName = rawFileName;

  try {
    decodedFileName = decodeURIComponent(rawFileName);
  } catch {
    // Si le nom n'est pas encodé correctement, on conserve la valeur brute.
  }

  return `${audioBaseUrl}/${encodeURIComponent(decodedFileName)}`;
}

function titleCase(value: string) {
  return value.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('fr-FR'));
}

function humanizeTrackTitle(value: string) {
  const cleaned = value
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*([,;:!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCase(cleaned)
    .replace(/\bJ['’] ?/gi, "J'")
    .replace(/\bL['’] ?/gi, "L'")
    .replace(/\bD['’] ?/gi, "D'")
    .replace(/\bQu['’] ?/gi, "Qu'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const defaultPlaylist: PlaylistItem[] = [
  {
    title: 'NOWIS - Chanson 1',
    src: `${audioBaseUrl}/chanson-1.mp3`,
  },
  {
    title: 'NOWIS - Chanson 2',
    src: `${audioBaseUrl}/chanson-2.mp3`,
  },
  {
    title: 'NOWIS - Chanson 3',
    src: `${audioBaseUrl}/chanson-3.mp3`,
  },
];

export function NowisRadio() {
  return <NowisRadioPanel compact={false} />;
}

type NowisRadioPanelProps = {
  compact?: boolean;
};

export function NowisRadioPanel({ compact = false }: NowisRadioPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(defaultPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const playlistReadyRef = useRef(false);
  const currentTrack = playlist[currentIndex] ?? playlist[0];

  useEffect(() => {
    let isMounted = true;

    async function loadPlaylist() {
      try {
        const response = await fetch(playlistUrl, { cache: 'no-store' });
        if (!response.ok) return;

        const data = (await response.json()) as PlaylistItem[];
        const validPlaylist = Array.isArray(data)
          ? data
              .filter((item) => item && typeof item.title === 'string' && typeof item.src === 'string' && item.src.length > 0)
              .map((item) => ({
                ...item,
                title: humanizeTrackTitle(item.title),
                src: toProxyAudioSrc(item.src),
              }))
          : [];

        if (isMounted && validPlaylist.length > 0) {
          setPlaylist(validPlaylist);
          setCurrentIndex(0);
          playlistReadyRef.current = true;

          // Tentative d'autoplay dès que la playlist est chargée.
          const audio = audioRef.current;
          if (audio) {
            audio.src = validPlaylist[0].src;
            audio.load();
            audio.play().then(() => {
              if (isMounted) {
                setIsStarted(true);
                setIsPlaying(true);
                setAutoplayBlocked(false);
              }
            }).catch(() => {
              // Navigateur bloque l'autoplay: on affiche la bannière.
              if (isMounted) {
                setAutoplayBlocked(true);
              }
            });
          }
        }
      } catch {
        // On garde la playlist par défaut si le manifeste n'est pas encore disponible.
      }
    }

    void loadPlaylist();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.preload = 'auto';
    audio.src = currentTrack.src;
    audio.load();
  }, [currentTrack.src]);

  const playTrack = async (trackIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playlist.length === 0) return;

    const normalizedIndex = (trackIndex + playlist.length) % playlist.length;
    const nextTrack = playlist[normalizedIndex];

    setCurrentIndex(normalizedIndex);
    setIsStarted(true);
    setIsLoading(true);

    audio.src = nextTrack.src;
    audio.currentTime = 0;
    audio.load();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startRadio = () => {
    void playTrack(currentIndex);
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !isStarted) {
      startRadio();
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const goToNextTrack = () => {
    void playTrack(currentIndex + 1);
  };

  const playlistLabel = playlist.length > 1 ? 'titres' : 'titre';

  return (
    <section className={`arcade-yellow-text rounded-3xl border border-sky-400/30 bg-[radial-gradient(circle_at_10%_0%,rgba(125,211,252,0.55),transparent_24%),radial-gradient(circle_at_92%_18%,rgba(103,232,249,0.40),transparent_18%),linear-gradient(180deg,rgba(224,242,254,0.96),rgba(186,230,253,0.92))] text-yellow-500 shadow-[0_20px_40px_rgba(56,189,248,0.25)] ${compact ? 'p-4 md:p-5' : 'p-5 md:p-6'}`}>
      {autoplayBlocked ? (
        <button
          type="button"
          onClick={() => {
            setAutoplayBlocked(false);
            startRadio();
          }}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-4 py-3 text-sm font-black text-sky-900 transition hover:brightness-110 animate-pulse"
        >
          <Play size={18} />
          Appuie ici pour démarrer la radio 🎵
        </button>
      ) : null}
      <div className={`flex flex-col gap-4 ${compact ? '' : 'lg:flex-row lg:items-center lg:justify-between'}`}>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-500">
            <Radio size={16} />
            Radio NOWIS
          </div>
          <h2 className={`${compact ? 'mt-2 text-lg md:text-xl' : 'mt-3 text-2xl md:text-3xl'} font-black text-yellow-500`}>
            {compact ? 'Radio musicale' : 'Écoute les chansons en boucle pendant que tu joues'}
          </h2>
          {!compact ? (
            <p className="mt-2 text-sm leading-6 text-yellow-500 md:text-base">
              La radio reste visible sur la page et passe automatiquement à la chanson suivante. Tu peux ajouter d’autres titres plus tard en modifiant seulement la playlist.
            </p>
          ) : null}
        </div>

        <div className={`flex flex-wrap gap-3 ${compact ? 'lg:justify-end' : ''}`}>
          <button
            type="button"
            onClick={startRadio}
            className={`inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-4 py-3 text-sm font-bold text-sky-900 transition hover:brightness-110 ${compact ? 'min-w-[9.5rem]' : ''}`}
          >
            <Play size={16} />
            Démarrer la radio
          </button>
          <button
            type="button"
            onClick={togglePlayPause}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-sky-400/35 bg-sky-500/12 px-4 py-3 text-sm font-bold text-yellow-500 transition hover:bg-sky-500/20"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Lecture'}
          </button>
          <button
            type="button"
            onClick={goToNextTrack}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-indigo-400/35 bg-indigo-500/12 px-4 py-3 text-sm font-bold text-yellow-500 transition hover:bg-indigo-500/20"
          >
            <SkipForward size={16} />
            Chanson suivante
          </button>
        </div>
      </div>

      <div className={`mt-5 grid gap-4 ${compact ? 'md:grid-cols-[1fr_auto]' : 'md:grid-cols-[1fr_auto] md:items-center'}`}>
        <div className={`rounded-2xl border border-sky-300/20 bg-[rgba(255,255,255,0.07)] ${compact ? 'p-3' : 'p-4'}`}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-yellow-500">
            <Volume2 size={14} />
            Chanson en cours
          </p>
          <p className={`${compact ? 'mt-1 text-sm' : 'mt-2 text-lg'} font-black text-yellow-500`}>{currentTrack.title}</p>
          <p className="mt-1 text-sm text-yellow-500">
            {isStarted ? (isLoading ? 'Chargement...' : isPlaying ? 'Lecture en cours' : 'Lecture en pause') : 'La radio attend ton clic'}
          </p>
        </div>

        {!compact ? (
          <div className="rounded-2xl border border-sky-300/30 bg-[rgba(255,255,255,0.5)] px-4 py-3 text-sm text-yellow-500">
            Playlist: {playlist.length} {playlistLabel}
            <div className="mt-1 text-xs text-yellow-500">Boucle automatique sur la dernière chanson</div>
          </div>
        ) : null}
      </div>

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          void playTrack(currentIndex + 1);
        }}
        onError={() => {
          setIsPlaying(false);
          setIsLoading(false);
        }}
        preload="auto"
      >
        <source src={currentTrack.src} type="audio/mpeg" />
        Votre navigateur ne supporte pas la lecture audio.
      </audio>

      {!compact ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-yellow-500">
          <ChevronRight size={14} />
          Le lecteur utilise un élément audio HTML5 et fonctionne sans intégration Spotify.
        </div>
      ) : null}
    </section>
  );
}
