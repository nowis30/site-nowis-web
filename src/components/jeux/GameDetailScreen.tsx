"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Gamepad2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type { GameEntry } from './gameCatalog';
import { enhanceEmbeddedGame } from './gameEnhancer';
import { getGameExperience } from './gameExperience';
import { getMobileControlsForGame, type MobileControlButton } from './mobileControls';

type GameDetailScreenProps = {
  game: GameEntry;
};

const directionLabels: Record<string, string> = {
  up: 'Haut',
  down: 'Bas',
  left: 'Gauche',
  right: 'Droite',
};

export function GameDetailScreen({ game }: GameDetailScreenProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gameExperienceRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);

  const controls = useMemo(() => getMobileControlsForGame(game.slug), [game.slug]);
  const profile = useMemo(() => getGameExperience(game.slug), [game.slug]);
  const hangmanLetters = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);
  const isExpandedMode = isNativeFullscreen || isImmersiveMode;
  const actionsAreKeypad = controls.actions.length >= 8;

  const frameHeightClass = useMemo(() => {
    if (isExpandedMode) {
      return 'h-full min-h-0';
    }

    switch (profile.layout) {
      case 'square':
        return 'h-[min(92vw,44rem)] min-h-[22rem] max-h-[44rem] md:h-[44rem]';
      case 'landscape':
        return 'h-[64dvh] min-h-[24rem] max-h-[44rem] md:h-[42rem]';
      case 'tall':
        return 'h-[86dvh] min-h-[40rem] max-h-[60rem] md:h-[60rem]';
      case 'portrait':
      default:
        return 'h-[78dvh] min-h-[32rem] max-h-[52rem] md:h-[50rem]';
    }
  }, [isExpandedMode, profile.layout]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setIsNativeFullscreen(inFullscreen);
      if (!inFullscreen) setIsImmersiveMode(false);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isImmersiveMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isImmersiveMode]);

  const dispatchKeyToGame = (button: MobileControlButton, type: 'keydown' | 'keyup') => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    const eventInit: KeyboardEventInit = {
      key: button.key,
      code: button.code,
      bubbles: true,
      cancelable: true,
    };

    try {
      const targets: EventTarget[] = [iframeWindow, iframeWindow.document];
      if (iframeWindow.document.body) targets.push(iframeWindow.document.body);
      if (iframeWindow.document.activeElement) targets.push(iframeWindow.document.activeElement);

      for (const target of targets) {
        target.dispatchEvent(new KeyboardEvent(type, eventInit));
      }
      iframeWindow.focus();
    } catch {
      // Le jeu reste utilisable avec ses contrôles natifs si un navigateur isole l'iframe.
    }
  };

  const onControlDown = (button: MobileControlButton) => {
    if (button.mode === 'tap') {
      dispatchKeyToGame(button, 'keydown');
      dispatchKeyToGame(button, 'keyup');
      return;
    }

    setPressed((prev) => ({ ...prev, [button.id]: true }));
    dispatchKeyToGame(button, 'keydown');
  };

  const onControlUp = (button: MobileControlButton) => {
    if (button.mode === 'tap') return;
    setPressed((prev) => ({ ...prev, [button.id]: false }));
    dispatchKeyToGame(button, 'keyup');
  };

  const requestGameFullscreen = async () => {
    const target = gameExperienceRef.current;
    if (!target) return;

    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
        setIsNativeFullscreen(true);
        return;
      }

      const webkitTarget = target as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };

      if (webkitTarget.webkitRequestFullscreen) {
        await webkitTarget.webkitRequestFullscreen();
        setIsNativeFullscreen(true);
        return;
      }
    } catch {
      // Le fallback immersif ci-dessous couvre iOS et les navigateurs restrictifs.
    }

    setIsImmersiveMode(true);
  };

  const exitExpandedMode = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Retour forcé au mode page normal ci-dessous.
      }
    }

    setIsNativeFullscreen(false);
    setIsImmersiveMode(false);
  };

  const reloadGame = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setIsEnhanced(false);
    iframe.src = game.src;
  };

  const onGameLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setIsEnhanced(enhanceEmbeddedGame(iframe, profile));
  };

  const findMove = (id: string) => controls.move.find((button) => button.id === id);

  const renderDirectionButton = (id: 'up' | 'down' | 'left' | 'right') => {
    const button = findMove(id);
    if (!button) return <div />;

    return (
      <button
        type="button"
        aria-label={directionLabels[id]}
        onPointerDown={(event) => {
          event.preventDefault();
          onControlDown(button);
        }}
        onPointerUp={() => onControlUp(button)}
        onPointerCancel={() => onControlUp(button)}
        onPointerLeave={() => onControlUp(button)}
        onContextMenu={(event) => event.preventDefault()}
        className={`flex aspect-square min-h-14 select-none touch-none items-center justify-center rounded-2xl border text-2xl font-black shadow-lg transition active:scale-95 sm:min-h-16 ${
          pressed[id]
            ? 'border-cyan-300 bg-cyan-300 text-slate-950 shadow-cyan-500/30'
            : 'border-slate-600 bg-slate-800 text-white hover:border-cyan-400 hover:bg-slate-700'
        }`}
      >
        {button.label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-3 pb-14 pt-4 text-slate-100 sm:px-4 md:px-6 md:pt-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%),linear-gradient(145deg,#020617,#0f172a_58%,#082f49)] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.28)] sm:p-6 md:p-8">
        <div className="relative">
          <Link
            href="/jeux"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
          >
            <ArrowLeft size={16} />
            Tous les jeux
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
              <Gamepad2 size={14} />
              Arcade NOWIS
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200">
              <Smartphone size={14} />
              {profile.interaction}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
              <Sparkles size={14} />
              Optimisé mobile
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {game.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            {profile.instruction}
          </p>
        </div>
      </section>

      <div
        ref={gameExperienceRef}
        className={
          isImmersiveMode
            ? 'fixed inset-0 z-[160] flex min-h-0 flex-col gap-2 overflow-hidden bg-slate-950 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]'
            : 'mt-5 space-y-4 md:mt-6'
        }
      >
        <section
          className={`border border-slate-700/80 bg-slate-950 shadow-2xl ${
            isImmersiveMode
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl p-2'
              : 'rounded-[1.5rem] p-2 sm:p-3 md:rounded-[2rem] md:p-4'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 sm:px-2 sm:pb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">{profile.interaction}</p>
              <h2 className="truncate text-base font-black text-white sm:text-lg">{game.name}</h2>
            </div>

            <div className="flex items-center gap-2">
              <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${isEnhanced ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {isEnhanced ? 'Mobile actif' : 'Chargement'}
              </span>
              <button
                type="button"
                onClick={reloadGame}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
                aria-label="Recharger le jeu"
              >
                <RotateCcw size={17} />
              </button>
              {isExpandedMode ? (
                <button
                  type="button"
                  onClick={exitExpandedMode}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-400/35 bg-rose-400/10 px-3 text-xs font-bold text-rose-200 transition hover:bg-rose-400/20"
                >
                  <Minimize2 size={16} />
                  <span className="hidden sm:inline">Quitter</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={requestGameFullscreen}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-3 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  <Maximize2 size={16} />
                  <span className="hidden sm:inline">Plein écran</span>
                </button>
              )}
            </div>
          </div>

          <div className={`min-h-0 overflow-hidden rounded-[1.15rem] border border-slate-700 bg-black ${isImmersiveMode ? 'flex flex-1' : ''}`}>
            <iframe
              ref={iframeRef}
              src={game.src}
              title={game.name}
              className={`w-full bg-slate-950 ${frameHeightClass}`}
              allow={profile.allowMicrophone ? 'fullscreen; microphone' : 'fullscreen'}
              onLoad={onGameLoad}
            />
          </div>
        </section>

        <section
          className={`border border-slate-700/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] ${
            isImmersiveMode
              ? 'max-h-[39dvh] shrink-0 overflow-y-auto rounded-2xl p-3'
              : 'rounded-[1.5rem] p-4 md:p-5'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Commandes téléphone</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                {profile.swipeToKeys ? 'Tu peux glisser directement sur le jeu ou utiliser les boutons ci-dessous.' : controls.hint}
              </p>
            </div>

            {!isExpandedMode ? (
              <a
                href={game.src}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
              >
                <ExternalLink size={15} />
                Jeu seul
              </a>
            ) : null}
          </div>

          {controls.move.length > 0 || controls.actions.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-end">
              {controls.move.length > 0 ? (
                <div className="grid w-full max-w-[14rem] grid-cols-3 gap-2 sm:max-w-[15rem]">
                  <div />
                  {renderDirectionButton('up')}
                  <div />
                  {renderDirectionButton('left')}
                  {renderDirectionButton('down')}
                  {renderDirectionButton('right')}
                </div>
              ) : null}

              {controls.actions.length > 0 ? (
                <div className={actionsAreKeypad ? 'grid grid-cols-5 gap-2 sm:grid-cols-6 lg:max-w-xl' : 'flex flex-wrap gap-2'}>
                  {controls.actions.map((button) => (
                    <button
                      key={button.id}
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onControlDown(button);
                      }}
                      onPointerUp={() => onControlUp(button)}
                      onPointerCancel={() => onControlUp(button)}
                      onPointerLeave={() => onControlUp(button)}
                      onContextMenu={(event) => event.preventDefault()}
                      className={`min-h-14 select-none touch-none rounded-2xl border px-4 py-2 text-sm font-black shadow-lg transition active:scale-95 ${
                        pressed[button.id]
                          ? 'border-fuchsia-300 bg-fuchsia-300 text-slate-950 shadow-fuchsia-500/30'
                          : 'border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-100 hover:border-fuchsia-300 hover:bg-fuchsia-400/20'
                      } ${actionsAreKeypad ? 'px-2 text-base' : ''}`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Joue directement dans la zone du jeu avec ton doigt.
            </div>
          )}

          {controls.letterPad ? (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Clavier Hangman</p>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9 md:grid-cols-13 md:gap-2">
                {hangmanLetters.map((letter) => {
                  const letterButton: MobileControlButton = {
                    id: `letter-${letter}`,
                    label: letter,
                    key: letter.toLowerCase(),
                    code: `Key${letter}`,
                    mode: 'tap',
                  };

                  return (
                    <button
                      key={letter}
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onControlDown(letterButton);
                      }}
                      className="min-h-11 select-none touch-none rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-100 transition active:scale-95 active:bg-emerald-300 active:text-slate-950"
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs leading-6 text-slate-600 shadow-sm md:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />
          <p>
            Certains mini-jeux sont adaptés à partir de projets open source. Les licences originales restent conservées avec les fichiers des jeux.
          </p>
        </div>
      </section>
    </div>
  );
}
