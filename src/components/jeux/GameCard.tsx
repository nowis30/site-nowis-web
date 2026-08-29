'use client';

import Link from 'next/link';
import { Play, Smartphone } from 'lucide-react';
import type { GameEntry } from './gameCatalog';

type GameCardProps = GameEntry & {
  index: number;
  icon: React.ReactNode;
  description: string;
  interaction: string;
};

const themes = [
  {
    glow: 'from-cyan-400/28 via-sky-500/10 to-transparent',
    border: 'group-hover:border-cyan-300/60',
    icon: 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100 shadow-cyan-500/15',
    button: 'from-cyan-300 to-sky-400 text-slate-950 shadow-cyan-500/20',
  },
  {
    glow: 'from-fuchsia-400/25 via-violet-500/10 to-transparent',
    border: 'group-hover:border-fuchsia-300/60',
    icon: 'border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-100 shadow-fuchsia-500/15',
    button: 'from-fuchsia-300 to-violet-400 text-slate-950 shadow-fuchsia-500/20',
  },
  {
    glow: 'from-emerald-400/24 via-teal-500/10 to-transparent',
    border: 'group-hover:border-emerald-300/60',
    icon: 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100 shadow-emerald-500/15',
    button: 'from-emerald-300 to-teal-400 text-slate-950 shadow-emerald-500/20',
  },
  {
    glow: 'from-amber-300/26 via-orange-500/10 to-transparent',
    border: 'group-hover:border-amber-300/60',
    icon: 'border-amber-300/35 bg-amber-300/12 text-amber-100 shadow-amber-500/15',
    button: 'from-amber-300 to-orange-400 text-slate-950 shadow-amber-500/20',
  },
] as const;

export function GameCard({ index, slug, name, icon, description, interaction }: GameCardProps) {
  const theme = themes[index % themes.length];

  return (
    <Link
      href={`/jeux/${slug}`}
      className="group block h-full touch-manipulation rounded-[1.55rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#02030a]"
    >
      <article
        className={`relative flex h-full min-h-[14.5rem] flex-col overflow-hidden rounded-[1.55rem] border border-white/10 bg-[linear-gradient(155deg,rgba(15,23,42,0.96),rgba(3,7,18,0.98))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_70px_rgba(0,0,0,0.58)] group-active:scale-[0.985] sm:p-5 ${theme.border}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.glow}`} />
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${theme.icon}`}>
            <span className="scale-110">{icon}</span>
          </div>

          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-300 backdrop-blur-sm">
            <Smartphone size={12} />
            {interaction}
          </span>
        </div>

        <div className="relative mt-4 flex-1">
          <h3 className="text-[1.3rem] font-black leading-tight tracking-tight text-white sm:text-[1.4rem]">{name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-300/85">{description}</p>
        </div>

        <div className={`relative mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-2.5 text-sm font-black shadow-lg transition group-hover:brightness-110 group-active:translate-y-px ${theme.button}`}>
          <Play size={17} fill="currentColor" />
          Jouer
        </div>
      </article>
    </Link>
  );
}
