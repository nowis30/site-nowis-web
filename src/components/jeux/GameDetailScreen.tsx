"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, ShieldCheck } from 'lucide-react';
import type { GameEntry } from './gameCatalog';
import { getMobileControlsForGame, type MobileControlButton } from './mobileControls';

type GameDetailScreenProps = {
  game: GameEntry;
};

export function GameDetailScreen({ game }: GameDetailScreenProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gameShellRef = useRef<HTMLDivElement>(null);
  const gameExperienceRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const controls = useMemo(() => getMobileControlsForGame(game.slug), [game.slug]);
  const hangmanLetters = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);
  const isExpandedMode = isNativeFullscreen || isImmersiveMode;

  // Jeux qui ont besoin d'une iframe plus haute pour être entièrement visibles.
  const tallGames = new Set([
    'solitaire',
    'chess',
    'minesweeper',
    'sudoku',
    'memory-card',
    'sliding-puzzle',
  ]);
  const isTallGame = tallGames.has(game.slug);

  useEffect(() => {
    const onFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement;
      const inFullscreen = Boolean(fullscreenElement);
      setIsNativeFullscreen(inFullscreen);

      if (!inFullscreen) {
        setIsImmersiveMode(false);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isImmersiveMode) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isImmersiveMode]);

  const dispatchKeyToGame = (button: MobileControlButton, type: 'keydown' | 'keyup') => {
    const iframeWindow = iframeRef.current?.contentWindow;

    if (!iframeWindow) {
      return;
    }

    const eventInit: KeyboardEventInit = {
      key: button.key,
      code: button.code,
      bubbles: true,
      cancelable: true,
    };

    try {
      iframeWindow.dispatchEvent(new KeyboardEvent(type, eventInit));
      iframeWindow.document.dispatchEvent(new KeyboardEvent(type, eventInit));
    } catch {
      // Certains jeux n'exposent pas les mêmes listeners; on ignore silencieusement.
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
    if (button.mode === 'tap') {
      return;
    }

    setPressed((prev) => ({ ...prev, [button.id]: false }));
    dispatchKeyToGame(button, 'keyup');
  };

  const requestGameFullscreen = async () => {
    const shell = gameExperienceRef.current ?? gameShellRef.current;
    const iframe = iframeRef.current;
    const target = shell ?? iframe;

    if (!target) {
      return;
    }

    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
        setIsNativeFullscreen(true);
        return;
      }

      const anyTarget = target as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };

      if (anyTarget.webkitRequestFullscreen) {
        await anyTarget.webkitRequestFullscreen();
        setIsNativeFullscreen(true);
        return;
      }
    } catch {
      // Fallback ci-dessous.
    }

    // Fallback mobile: mode immersif intégré pour garder les commandes visibles.
    setIsImmersiveMode(true);
  };

  const exitExpandedMode = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore, puis bascule en mode page normal.
      }
    }

    setIsNativeFullscreen(false);
    setIsImmersiveMode(false);
  };

  const reloadGame = () => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    iframe.src = game.src;
  };

  return (
    <div className="arcade-yellow-text mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pt-10">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-sky-400/30 bg-[radial-gradient(circle_at_10%_10%,rgba(125,211,252,0.55),transparent_22%),radial-gradient(circle_at_92%_12%,rgba(103,232,249,0.40),transparent_18%),radial-gradient(circle_at_52%_0%,rgba(147,197,253,0.35),transparent_20%),linear-gradient(180deg,rgba(224,242,254,0.96),rgba(186,230,253,0.92))] px-5 py-7 shadow-[0_20px_60px_rgba(56,189,248,0.25)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.26),transparent_22%),radial-gradient(circle_at_92%_12%,rgba(34,211,238,0.20),transparent_18%),radial-gradient(circle_at_52%_0%,rgba(96,165,250,0.14),transparent_20%)]" />
        <div className="absolute left-[-5rem] top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.4),transparent_65%)] blur-2xl" />
        <div className="absolute right-[-4rem] top-28 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.34),transparent_62%)] blur-2xl" />

        <div className="relative space-y-6">
          <Link
            href="/jeux"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-300/20 bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-yellow-50 transition hover:bg-sky-500/18"
          >
            <ArrowLeft size={16} />
            Retour à la liste des jeux
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-yellow-500">
            <Gamepad2 size={16} />
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-100">Jeu NOWIS</p>
          </div>

          <div>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-yellow-100 drop-shadow-[0_0_14px_rgba(250,204,21,0.9)] md:text-6xl">
              {game.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-yellow-50 md:text-lg">
              Profite d’une page dédiée à ce mini-jeu avec une zone de jeu large et la radio musicale de Création Nowis juste en dessous.
            </p>
          </div>
        </div>
      </section>

      <div
        ref={gameExperienceRef}
        className={`mt-8 space-y-6 ${
          isImmersiveMode
            ? 'fixed inset-0 z-[100] mt-0 overflow-auto bg-[linear-gradient(180deg,rgba(224,242,254,0.98),rgba(186,230,253,0.98))] p-3 sm:p-4'
            : ''
        }`}
      >
      <section className="rounded-[2rem] border border-sky-400/30 bg-[linear-gradient(180deg,rgba(224,242,254,0.96),rgba(186,230,253,0.92))] p-4 md:p-6">
        <div className="flex items-center gap-3 border-b border-sky-300/15 pb-4">
          <Gamepad2 size={18} className="text-yellow-50" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-500">Zone de jeu</p>
            <h2 className="mt-2 text-2xl font-black text-yellow-500 md:text-3xl">{game.name}</h2>
          </div>
        </div>

        <div ref={gameShellRef} className="mt-5 overflow-hidden rounded-[1.5rem] border border-sky-300/15 bg-slate-950">
          <div className="flex items-center justify-between gap-3 border-b border-sky-300/15 px-4 py-3 text-xs text-yellow-50">
            <span>{game.src}</span>
            <span>Zone de jeu</span>
          </div>
          <iframe
            ref={iframeRef}
            src={game.src}
            title={game.name}
            className={`w-full bg-white ${
              isExpandedMode
                ? isTallGame
                  ? 'h-[72dvh] min-h-[28rem] md:h-[78vh]'
                  : 'h-[52dvh] min-h-[14rem] md:h-[62vh]'
                : isTallGame
                  ? 'h-[90vh] min-h-[40rem] md:h-[60rem]'
                  : 'h-[70vh] min-h-[28rem] md:h-[42rem]'
            }`}
            allow="fullscreen"
          />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-sky-300/30 bg-[linear-gradient(180deg,rgba(224,242,254,0.96),rgba(186,230,253,0.92))] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-500">Commandes mobiles</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestGameFullscreen}
              className="inline-flex min-h-10 items-center rounded-xl border border-sky-400/35 bg-sky-500/12 px-3 py-2 text-xs font-semibold text-yellow-500 transition hover:bg-sky-500/20"
            >
              Plein ecran + commandes
            </button>
            {isExpandedMode ? (
              <button
                type="button"
                onClick={exitExpandedMode}
                className="inline-flex min-h-10 items-center rounded-xl border border-rose-400/35 bg-rose-500/12 px-3 py-2 text-xs font-semibold text-yellow-500 transition hover:bg-rose-500/20"
              >
                Quitter plein ecran
              </button>
            ) : null}
            <a
              href={game.src}
              className="inline-flex min-h-10 items-center rounded-xl border border-cyan-400/35 bg-cyan-500/12 px-3 py-2 text-xs font-semibold text-yellow-500 transition hover:bg-cyan-500/20"
            >
              Jeu seul
            </a>
            <button
              type="button"
              onClick={reloadGame}
              className="inline-flex min-h-10 items-center rounded-xl border border-sky-400/35 bg-sky-500/12 px-3 py-2 text-xs font-semibold text-yellow-500 transition hover:bg-sky-500/20"
            >
              Recharger
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-yellow-500">{controls.hint}</p>

        {controls.move.length > 0 || controls.actions.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid grid-cols-3 gap-2 max-w-[15rem]">
              <div />
              {controls.move.find((b) => b.id === 'up') ? (
                <button
                  type="button"
                  onPointerDown={() => onControlDown(controls.move.find((b) => b.id === 'up')!)}
                  onPointerUp={() => onControlUp(controls.move.find((b) => b.id === 'up')!)}
                  onPointerCancel={() => onControlUp(controls.move.find((b) => b.id === 'up')!)}
                  onPointerLeave={() => onControlUp(controls.move.find((b) => b.id === 'up')!)}
                  className={`min-h-12 rounded-xl border text-base font-black transition ${pressed.up ? 'border-cyan-400 bg-cyan-500/30 text-yellow-400' : 'border-sky-400/35 bg-sky-500/12 text-yellow-500 hover:bg-sky-500/20'}`}
                >
                  ↑
                </button>
              ) : (
                <div />
              )}
              <div />

              {controls.move.find((b) => b.id === 'left') ? (
                <button
                  type="button"
                  onPointerDown={() => onControlDown(controls.move.find((b) => b.id === 'left')!)}
                  onPointerUp={() => onControlUp(controls.move.find((b) => b.id === 'left')!)}
                  onPointerCancel={() => onControlUp(controls.move.find((b) => b.id === 'left')!)}
                  onPointerLeave={() => onControlUp(controls.move.find((b) => b.id === 'left')!)}
                  className={`min-h-12 rounded-xl border text-base font-black transition ${pressed.left ? 'border-cyan-400 bg-cyan-500/30 text-yellow-400' : 'border-sky-400/35 bg-sky-500/12 text-yellow-500 hover:bg-sky-500/20'}`}
                >
                  ←
                </button>
              ) : (
                <div />
              )}

              {controls.move.find((b) => b.id === 'down') ? (
                <button
                  type="button"
                  onPointerDown={() => onControlDown(controls.move.find((b) => b.id === 'down')!)}
                  onPointerUp={() => onControlUp(controls.move.find((b) => b.id === 'down')!)}
                  onPointerCancel={() => onControlUp(controls.move.find((b) => b.id === 'down')!)}
                  onPointerLeave={() => onControlUp(controls.move.find((b) => b.id === 'down')!)}
                  className={`min-h-12 rounded-xl border text-base font-black transition ${pressed.down ? 'border-cyan-400 bg-cyan-500/30 text-yellow-400' : 'border-sky-400/35 bg-sky-500/12 text-yellow-500 hover:bg-sky-500/20'}`}
                >
                  ↓
                </button>
              ) : (
                <div />
              )}

              {controls.move.find((b) => b.id === 'right') ? (
                <button
                  type="button"
                  onPointerDown={() => onControlDown(controls.move.find((b) => b.id === 'right')!)}
                  onPointerUp={() => onControlUp(controls.move.find((b) => b.id === 'right')!)}
                  onPointerCancel={() => onControlUp(controls.move.find((b) => b.id === 'right')!)}
                  onPointerLeave={() => onControlUp(controls.move.find((b) => b.id === 'right')!)}
                  className={`min-h-12 rounded-xl border text-base font-black transition ${pressed.right ? 'border-cyan-400 bg-cyan-500/30 text-yellow-400' : 'border-sky-400/35 bg-sky-500/12 text-yellow-500 hover:bg-sky-500/20'}`}
                >
                  →
                </button>
              ) : (
                <div />
              )}
            </div>

            {controls.actions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {controls.actions.map((button) => (
                  <button
                    key={button.id}
                    type="button"
                    onPointerDown={() => onControlDown(button)}
                    onPointerUp={() => onControlUp(button)}
                    onPointerCancel={() => onControlUp(button)}
                    onPointerLeave={() => onControlUp(button)}
                    className={`min-h-12 rounded-xl border px-4 py-2 text-sm font-black transition ${pressed[button.id] ? 'border-fuchsia-400 bg-fuchsia-500/30 text-yellow-400' : 'border-fuchsia-400/35 bg-fuchsia-500/12 text-yellow-500 hover:bg-fuchsia-500/20'}`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {controls.letterPad ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">Lettres Hangman</p>
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-9 md:grid-cols-13">
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
                    onPointerDown={() => onControlDown(letterButton)}
                    className="min-h-10 rounded-lg border border-emerald-400/35 bg-emerald-500/12 text-sm font-black text-yellow-500 transition hover:bg-emerald-500/20"
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

      <section className="mt-8 rounded-3xl border border-sky-300/30 bg-[linear-gradient(180deg,rgba(224,242,254,0.96),rgba(186,230,253,0.92))] p-5 text-xs leading-6 text-yellow-500 md:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-yellow-50" />
          <p>
            Certains mini-jeux sont adaptés à partir de projets open source. Les licences originales sont conservées dans les dossiers des jeux.
          </p>
        </div>
      </section>
    </div>
  );
}