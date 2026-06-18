'use client';

import Link from 'next/link';
import { ArrowLeft, Gamepad2, Music3, ShieldCheck } from 'lucide-react';
import { NowisRadio } from './NowisRadio';
import type { GameEntry } from './gameCatalog';

type GameDetailScreenProps = {
  game: GameEntry;
};

export function GameDetailScreen({ game }: GameDetailScreenProps) {
  return (
    <div className="arcade-yellow-text mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pt-10">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-sky-400/20 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.26),transparent_22%),radial-gradient(circle_at_92%_12%,rgba(34,211,238,0.20),transparent_18%),radial-gradient(circle_at_52%_0%,rgba(96,165,250,0.14),transparent_20%),linear-gradient(180deg,rgba(8,15,32,0.99),rgba(6,28,68,0.98))] px-5 py-7 shadow-[0_30px_80px_rgba(0,0,0,0.42)] md:px-8 md:py-10">
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

          <div className="flex flex-wrap items-center gap-3 text-white">
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

      <section className="mt-8 rounded-[2rem] border border-sky-400/15 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-4 md:p-6">
        <div className="flex items-center gap-3 border-b border-sky-300/15 pb-4">
          <Gamepad2 size={18} className="text-yellow-50" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white">Zone de jeu</p>
            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">{game.name}</h2>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-sky-300/15 bg-slate-950">
          <div className="flex items-center justify-between gap-3 border-b border-sky-300/15 px-4 py-3 text-xs text-yellow-50">
            <span>{game.src}</span>
            <span>Page dédiée</span>
          </div>
          <iframe
            src={game.src}
            title={game.name}
            className="h-[30rem] w-full bg-white md:h-[42rem]"
            allow="fullscreen"
          />
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] md:p-5">
        <div className="mb-4 flex items-center gap-2 text-yellow-50">
          <Music3 size={16} />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-50">Radio sous le jeu</p>
        </div>
        <NowisRadio />
      </section>

      <section className="mt-8 rounded-3xl border border-sky-300/15 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-5 text-xs leading-6 text-yellow-50 md:p-6">
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