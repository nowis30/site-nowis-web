'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pause, Play, SkipForward, X } from 'lucide-react';
import { shuffleTracks } from '@/lib/radio-shuffle';
import { parseRadioSession, RADIO_SESSION_KEY } from '@/lib/radio-session';
import tracks from '@/data/radio-tracks.json';
import { ShareMenu } from './ShareMenu';

const catalog = JSON.stringify(tracks.map(({ id, src }) => [id, src]));

type RadioState = {
  track: (typeof tracks)[number] | null;
  playing: boolean;
  loading: boolean;
  message: string;
  volume: number;
  positionInCycle: number;
  totalTracks: number;
  isSelection: boolean;
  playTrack: (id: string) => void;
  playSelection: (ids: string[]) => void;
  playRadio: () => void;
  clearSelection: () => void;
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
  const selection = useRef<number[] | null>(null);
  const [selectionSize, setSelectionSize] = useState(0);
  const operation = useRef(0);
  const failed = useRef(new Set<number>());
  const wantsPlayback = useRef(false);
  const resumePosition = useRef(0);
  const pendingSeek = useRef(false);
  const lastSavedSecond = useRef(-1);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [volume, updateVolume] = useState(0.7);
  const [positionInCycle, setPositionInCycle] = useState(0);

  function saveSession() {
    if (current.current < 0) return;
    try {
      sessionStorage.setItem(RADIO_SESSION_KEY, JSON.stringify({
        catalog, queue: queue.current, current: current.current, position: resumePosition.current,
        ...(selection.current ? { selection: selection.current } : {}),
      }));
    } catch { /* A browser that blocks storage can still play the whole catalogue. */ }
  }

  function recordPosition(force = false) {
    const element = audio.current;
    if (!element?.getAttribute('src') || pendingSeek.current || element.readyState === 0) return;
    resumePosition.current = element.currentTime;
    const second = Math.floor(element.currentTime / 5);
    if (force || second !== lastSavedSecond.current) {
      lastSavedSecond.current = second;
      saveSession();
    }
  }

  function stop() {
    recordPosition(true);
    operation.current++;
    wantsPlayback.current = false;
    audio.current?.pause();
    audio.current?.removeAttribute('src');
    audio.current?.load();
    setIndex(-1);
    setPlaying(false);
    setLoading(false);
    setMessage('');
  }

  function play() {
    const element = audio.current;
    if (!element) return;
    const attempt = ++operation.current;
    const selected = current.current;
    wantsPlayback.current = true;
    setLoading(true);
    setMessage('');
    void element.play().catch((error: unknown) => {
      if (attempt !== operation.current) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        wantsPlayback.current = false;
        setMessage('Appuyez sur Lecture pour reprendre la radio.');
      } else if (!(error instanceof DOMException && error.name === 'AbortError')) {
        unavailable(selected, attempt);
      }
    }).finally(() => {
      if (attempt === operation.current) setLoading(false);
    });
  }

  function next() {
    const element = audio.current;
    if (!element) return;
    if (!queue.current.length) {
      if (failed.current.size >= (selection.current?.length ?? tracks.length)) {
        wantsPlayback.current = false;
        element.pause();
        setPlaying(false);
        setLoading(false);
        setMessage('La radio est momentanément indisponible. Réessayez dans un instant.');
        return;
      }
      // A temporary loading error must never reduce all later tours to a few songs.
      failed.current.clear();
      queue.current = selection.current ? [...selection.current] : shuffleTracks(tracks.length, current.current);
    }
    const selected = queue.current.shift()!;
    current.current = selected;
    resumePosition.current = 0;
    pendingSeek.current = false;
    lastSavedSecond.current = -1;
    setIndex(selected);
    setPositionInCycle((selection.current?.length ?? tracks.length) - queue.current.length);
    setPlaying(false);
    saveSession();
    operation.current++;
    element.src = tracks[selected].src;
    element.load();
    play();
  }

  function unavailable(selected = current.current, attempt = operation.current) {
    if (!wantsPlayback.current || attempt !== operation.current || selected !== current.current
      || failed.current.has(selected)) return;
    if (!navigator.onLine) {
      recordPosition(true);
      wantsPlayback.current = false;
      operation.current++;
      audio.current?.pause();
      setPlaying(false);
      setLoading(false);
      setMessage('Connexion interrompue. Appuyez sur Lecture après le retour du réseau pour reprendre ce titre.');
      return;
    }
    failed.current.add(current.current);
    next();
  }

  function toggle() {
    if (wantsPlayback.current) {
      wantsPlayback.current = false;
      operation.current++;
      audio.current?.pause();
      recordPosition(true);
      setLoading(false);
    } else if (current.current < 0 || failed.current.has(current.current)) {
      failed.current.clear();
      next();
    } else {
      const element = audio.current;
      if (!element) return;
      setIndex(current.current);
      setPositionInCycle((selection.current?.length ?? tracks.length) - queue.current.length);
      if (!element.getAttribute('src') || element.error) {
        pendingSeek.current = resumePosition.current > 0;
        element.src = tracks[current.current].src;
        element.load();
      }
      play();
    }
  }

  function setVolume(value: number) {
    updateVolume(value);
    if (audio.current) audio.current.volume = value;
  }

  function playTrack(id: string) {
    const selected = tracks.findIndex(track => track.id === id);
    if (selected < 0) return;
    selection.current = null; setSelectionSize(0); failed.current.clear();
    queue.current = [selected, ...shuffleTracks(tracks.length, selected).filter(index => index !== selected)];
    next();
  }

  function playSelection(ids: string[]) {
    const indices = [...new Set(ids)].map(id => tracks.findIndex(track => track.id === id)).filter(index => index >= 0);
    if (!indices.length) return;
    selection.current = indices; setSelectionSize(indices.length); failed.current.clear();
    queue.current = [...indices]; next();
  }

  function playRadio() {
    selection.current = null; setSelectionSize(0); failed.current.clear();
    queue.current = shuffleTracks(tracks.length, current.current); next();
  }

  function clearSelection() {
    if (!selection.current) return;
    stop(); selection.current = null; setSelectionSize(0);
    current.current = -1; queue.current = []; resumePosition.current = 0; failed.current.clear();
    try { sessionStorage.removeItem(RADIO_SESSION_KEY); } catch { /* Optional storage. */ }
  }

  useEffect(() => {
    const element = audio.current;
    if (element) element.volume = 0.7;
    try {
      const saved = parseRadioSession(sessionStorage.getItem(RADIO_SESSION_KEY), catalog, tracks.length);
      if (saved) {
        queue.current = saved.queue;
        current.current = saved.current;
        resumePosition.current = saved.position;
        selection.current = saved.selection ?? null;
        setSelectionSize(saved.selection?.length ?? 0);
      }
    } catch { /* Storage is optional. Never autoplay on reload. */ }
    return () => { element?.pause(); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nowis-radio-active', index >= 0);
    return () => document.body.classList.remove('nowis-radio-active');
  }, [index]);

  const value = { track: tracks[index] ?? null, playing, loading, message, volume,
    positionInCycle, totalTracks: selectionSize || tracks.length, isSelection: selectionSize > 0,
    toggle, next, stop, setVolume, playTrack, playSelection, playRadio, clearSelection };
  return <RadioContext.Provider value={value}>
    {children}
    <audio ref={audio} data-testid="nowis-radio-audio" preload="none"
      onLoadedMetadata={() => {
        const element = audio.current;
        if (element && pendingSeek.current) {
          // A saved position at EOF continues to the next song, rather than replaying it.
          element.currentTime = Math.min(resumePosition.current, element.duration);
          pendingSeek.current = false;
        }
      }}
      onTimeUpdate={() => recordPosition()}
      onPlaying={() => { setPlaying(true); setLoading(false); }}
      onPause={() => { setPlaying(false); recordPosition(true); }}
      onWaiting={() => { if (wantsPlayback.current) setLoading(true); }}
      onEnded={() => { if (wantsPlayback.current) next(); }}
      onError={() => { if (audio.current?.error) unavailable(); }} />
    {index >= 0 && <aside className="nr-dock" aria-label="Lecteur Radio Nowis">
      <Link href="/radio" className="nr-dock-title"><small>{selectionSize ? 'MES FAVORIS' : 'RADIO NOWIS'} · {positionInCycle}/{selectionSize || tracks.length}</small><strong>{tracks[index].title}</strong></Link>
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
    <ShareMenu compact={compact} />
    {!compact && <label className="nr-volume">Volume<input aria-label="Volume de la radio" type="range" min="0" max="1" step="0.05" value={radio.volume} onChange={event => radio.setVolume(Number(event.target.value))} /></label>}
  </div>;
}
