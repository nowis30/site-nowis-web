'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

/** Raw Vite document. Asset URLs inside it are absolute, so this path is stable in an iframe or a new tab. */
export const GALOP_STATIC_URL = '/jeux/a-deux-au-galop/index.html';

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void;
};

export function GalopGame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const markReady = () => setReady(true);
    frame.addEventListener('load', markReady);
    // A static file can finish loading before React attaches onLoad.
    try {
      if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.location?.href !== 'about:blank') {
        markReady();
      }
    } catch {
      // The frame stays same-origin; ignore a transient access error.
    }
    return () => frame.removeEventListener('load', markReady);
  }, []);

  async function toggleFullscreen() {
    const frame = frameRef.current as FullscreenElement | null;
    if (!frame) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (typeof frame.requestFullscreen === 'function') {
        await frame.requestFullscreen();
        return;
      }
      frame.webkitRequestFullscreen?.();
    } catch {
      // iOS Safari often rejects fullscreen on an iframe. The new-tab link stays available.
    }
  }

  return (
    <main className="fixed inset-0 z-[1000] flex h-[100dvh] flex-col bg-[#1c2e22] text-white">
      <h1 className="sr-only">À deux au galop</h1>
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-[#142218] px-[max(0.5rem,env(safe-area-inset-left))] py-2 pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/jeux"
          aria-label="Retour aux jeux"
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 text-sm font-bold text-white"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Retour</span>
        </Link>
        <p className="hidden min-w-0 flex-1 truncate px-1 text-sm font-black tracking-tight sm:block">À deux au galop</p>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-lime-200/30 bg-lime-300 px-3 text-sm font-black text-lime-950"
        >
          {fullscreen ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
          <span>{fullscreen ? 'Quitter' : 'Plein écran'}</span>
        </button>
        <a
          href={GALOP_STATIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 text-sm font-bold text-white"
        >
          <ExternalLink size={18} aria-hidden="true" />
          <span>Nouvel onglet</span>
        </a>
      </header>
      <div className="relative min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
        <iframe
          ref={frameRef}
          title="À deux au galop"
          src={GALOP_STATIC_URL}
          className="h-full w-full border-0 bg-[#1c2e22]"
          allow="fullscreen; gamepad"
          onLoad={() => setReady(true)}
        />
        {ready ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1c2e22] px-6 text-center">
            <p className="text-sm font-bold text-lime-50">Chargement de Noisette…</p>
          </div>
        )}
      </div>
    </main>
  );
}
