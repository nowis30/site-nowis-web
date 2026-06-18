'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Pause, Play, Radio, SkipForward, Volume2 } from 'lucide-react';

type PlaylistItem = {
  title: string;
  src: string;
};

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
    src: '/audio/nowis-radio/chanson-1.mp3',
  },
  {
    title: 'NOWIS - Chanson 2',
    src: '/audio/nowis-radio/chanson-2.mp3',
  },
  {
    title: 'NOWIS - Chanson 3',
    src: '/audio/nowis-radio/chanson-3.mp3',
  },
];

export function NowisRadio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(defaultPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentTrack = playlist[currentIndex] ?? playlist[0];

  useEffect(() => {
    let isMounted = true;

    async function loadPlaylist() {
      try {
        const response = await fetch('/audio/nowis-radio/playlist.json', { cache: 'no-store' });
        if (!response.ok) return;

        const data = (await response.json()) as PlaylistItem[];
        const validPlaylist = Array.isArray(data)
          ? data
              .filter((item) => item && typeof item.title === 'string' && typeof item.src === 'string' && item.src.length > 0)
              .map((item) => ({
                ...item,
                title: humanizeTrackTitle(item.title),
              }))
          : [];

        if (isMounted && validPlaylist.length > 0) {
          setPlaylist(validPlaylist);
          setCurrentIndex(0);
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
    <section className="arcade-yellow-text rounded-3xl border border-sky-400/20 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.22),transparent_24%),radial-gradient(circle_at_92%_18%,rgba(34,211,238,0.18),transparent_18%),linear-gradient(180deg,rgba(10,18,40,0.98),rgba(8,32,64,0.96))] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.38)] md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-50">
            <Radio size={16} />
            Radio NOWIS
          </div>
          <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">Écoute les chansons en boucle pendant que tu joues</h2>
          <p className="mt-2 text-sm leading-6 text-white md:text-base">
            La radio reste visible sur la page et passe automatiquement à la chanson suivante. Tu peux ajouter d’autres titres plus tard en modifiant seulement la playlist.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startRadio}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            <Play size={16} />
            Démarrer la radio
          </button>
          <button
            type="button"
            onClick={togglePlayPause}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/12 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-500/20"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Lecture'}
          </button>
          <button
            type="button"
            onClick={goToNextTrack}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-indigo-300/25 bg-indigo-500/12 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500/20"
          >
            <SkipForward size={16} />
            Chanson suivante
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="rounded-2xl border border-sky-300/20 bg-[rgba(255,255,255,0.07)] p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white">
            <Volume2 size={14} />
            Chanson en cours
          </p>
          <p className="mt-2 text-lg font-black text-white">{currentTrack.title}</p>
          <p className="mt-1 text-sm text-white">
            {isStarted ? (isLoading ? 'Chargement...' : isPlaying ? 'Lecture en cours' : 'Lecture en pause') : 'La radio attend ton clic'}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-300/20 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white">
          Playlist: {playlist.length} {playlistLabel}
          <div className="mt-1 text-xs text-white">Boucle automatique sur la dernière chanson</div>
        </div>
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

      <div className="mt-4 flex items-center gap-2 text-xs text-white">
        <ChevronRight size={14} />
        Le lecteur utilise un élément audio HTML5 et fonctionne sans intégration Spotify.
      </div>
    </section>
  );
}
