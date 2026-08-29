"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { GameEntry } from './gameCatalog';
import { enhanceEmbeddedGame } from './gameEnhancer';
import { getGameExperience } from './gameExperience';
import { hasSourceGame } from './gameUpgrades';

type GameDetailScreenProps = {
  game: GameEntry;
};

const SOURCE_GAME_SHELL = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"></head><body></body></html>';

export function GameDetailScreen({ game }: GameDetailScreenProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const profile = useMemo(() => getGameExperience(game.slug), [game.slug]);
  const isSourceGame = useMemo(() => hasSourceGame(game.slug), [game.slug]);

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

  const onGameLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    enhanceEmbeddedGame(iframe, profile);
    setIsReady(true);
  };

  return (
    <main className="fixed inset-0 z-[1000] h-[100dvh] w-screen overflow-hidden bg-black text-white">
      <iframe
        ref={iframeRef}
        src={isSourceGame ? undefined : game.src}
        srcDoc={isSourceGame ? SOURCE_GAME_SHELL : undefined}
        title={game.name}
        className="absolute inset-0 h-full w-full border-0 bg-black"
        allow={profile.allowMicrophone ? 'fullscreen; microphone' : 'fullscreen'}
        onLoad={onGameLoad}
      />

      {!isReady ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-white" aria-label="Chargement du jeu" />
        </div>
      ) : null}

      <Link
        href="/jeux"
        aria-label="Retour aux jeux"
        className="absolute left-[max(0.6rem,env(safe-area-inset-left))] top-[max(0.6rem,env(safe-area-inset-top))] z-20 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 px-3 text-white shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md transition active:scale-95 sm:min-h-12 sm:min-w-12"
      >
        <ArrowLeft size={22} strokeWidth={2.5} />
        <span className="sr-only">Retour aux jeux</span>
      </Link>
    </main>
  );
}
