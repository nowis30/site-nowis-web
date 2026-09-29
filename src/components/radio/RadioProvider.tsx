'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pause, Play, SkipForward, X } from 'lucide-react';
import { shuffleTracks } from '@/lib/radio-shuffle';
import tracks from '@/data/radio-tracks.json';

type RadioState = {
  track: (typeof tracks)[number] | null;
  playing: boolean;
  loading: boolean;
  message: string;
  volume: number;
  toggle: () => void;
  next: () => void;
  stop: () => void;
  setVolume: (value: number) => void;
};
const RadioContext = createContext<RadioState | null>(null);
export function useRadio() {
  const value = useContext(RadioContext);
  if (!value) throw new Error('RadioProvider is required');
  return value;
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const queue = useRef<number[]>([]);
  const current = useRef(-1);
  const operation = useRef(0);
  const failed = useRef(new Set<number>());
  const wantsPlayback = useRef(false);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [volume, updateVolume] = useState(0.7);

  function stop() {
    operation.current++;
    wantsPlayback.current = false;
    audio.current?.pause();
    audio.current?.removeAttribute('src');
    audio.current?.load();
    current.current = -1;
    queue.current = [];
    failed.current.clear();
    setIndex(-1);
    setPlaying(false);
    setLoading(false);
    setMessage('');
  }

  function play() {
    const element = audio.current;
    if (!element) return;
    const attempt = ++operation.current;
    wantsPlayback.current = true;
    setLoading(true);
    setMessage('');
    void element.play().catch((error: unknown) => {
      if (attempt !== operation.current) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        wantsPlayback.current = false;
        setMessage('Appuyez sur Lecture pour reprendre la radio.');
      } else if (!(error instanceof DOMException && error.name === 'AbortError')) {
        unavailable();
      }
    }).finally(() => {
      if (attempt === operation.current) setLoading(false);
    });
  }

  function next() {
    const element = audio.current;
    if (!element) return;
    if (failed.current.size >= tracks.length) {
      wantsPlayback.current = false;
      element.pause();
      setLoading(false);
      setMessage('La radio est momentanément indisponible. Réessayez dans un instant.');
      return;
    }
    if (!queue.current.length) queue.current = shuffleTracks(tracks.length, current.current);
    let selected = queue.current.shift()!;
    while (failed.current.has(selected)) {
      if (!queue.current.length) queue.current = shuffleTracks(tracks.length, current.current);
      selected = queue.current.shift()!;
    }
    current.current = selected;
    setIndex(selected);
    operation.current++;
    element.src = tracks[selected].src;
    element.load();
    play();
  }

  function unavailable() {
    if (!wantsPlayback.current || failed.current.has(current.current)) return;
    failed.current.add(current.current);
    next();
  }

  function toggle() {
    if (wantsPlayback.current) {
      wantsPlayback.current = false;
      operation.current++;
      audio.current?.pause();
      setLoading(false);
    } else if (current.current < 0 || failed.current.has(current.current)) {
      failed.current.clear();
      next();
    } else play();
  }

  function setVolume(value: number) {
    updateVolume(value);
    if (audio.current) audio.current.volume = value;
  }

  useEffect(() => {
    const element = audio.current;
    if (element) element.volume = 0.7;
    return () => { element?.pause(); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nowis-radio-active', index >= 0);
    return () => document.body.classList.remove('nowis-radio-active');
  }, [index]);

  const value = { track: tracks[index] ?? null, playing, loading, message, volume, toggle, next, stop, setVolume };
  return <RadioContext.Provider value={value}>
    {children}
    <audio ref={audio} data-testid="nowis-radio-audio" preload="none"
      onPlaying={() => { setPlaying(true); setLoading(false); }}
      onPause={() => setPlaying(false)} onWaiting={() => { if (wantsPlayback.current) setLoading(true); }}
      onEnded={next} onError={unavailable} />
    {index >= 0 && <aside className="nr-dock" aria-label="Lecteur Radio Nowis">
      <Link href="/radio" className="nr-dock-title"><small>RADIO NOWIS · ALÉATOIRE</small><strong>{tracks[index].title}</strong></Link>
      <RadioControls compact />
      <button className="nr-icon" onClick={stop} aria-label="Arrêter et fermer la radio"><X size={19} /></button>
      {message && <p role="status" className="nr-message">{message}</p>}
    </aside>}
  </RadioContext.Provider>;
}

export function RadioControls({ compact = false }: { compact?: boolean }) {
  const radio = useRadio();
  return <div className="nr-controls">
    <button type="button" className={compact ? 'nr-icon nr-play' : 'cta-primary'} onClick={radio.toggle}
      aria-label={radio.playing || radio.loading ? 'Mettre la radio en pause' : 'Écouter la radio'}>
      {radio.playing || radio.loading ? <Pause size={20} /> : <Play size={20} />}
      {!compact && (radio.loading ? 'Chargement…' : radio.playing ? 'Pause' : radio.track ? 'Reprendre' : 'Écouter la radio')}
    </button>
    <button type="button" className="nr-icon" onClick={radio.next} aria-label="Chanson suivante"><SkipForward size={21} /></button>
    {!compact && <label className="nr-volume">Volume<input aria-label="Volume de la radio" type="range" min="0" max="1" step="0.05" value={radio.volume} onChange={event => radio.setVolume(Number(event.target.value))} /></label>}
  </div>;
}
