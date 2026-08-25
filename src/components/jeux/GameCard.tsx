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

const accents = [
  'from-cyan-400/20 via-sky-400/5 to-transparent',
  'from-violet-400/20 via-fuchsia-400/5 to-transparent',
  'from-emerald-400/20 via-teal-400/5 to-transparent',
  'from-amber-300/20 via-orange-400/5 to-transparent',
] as const;

const iconAccents = [
  'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  'border-violet-400/30 bg-violet-400/10 text-violet-200',
  'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  'border-amber-300/30 bg-amber-300/10 text-amber-200',
] as const;

export function GameCard({ index, slug, name, icon, description, interaction }: GameCardProps) {
  const accent = accents[index % accents.length];
  const iconAccent = iconAccents[index % iconAccents.length];

  return (
    <Link
      href={`/jeux/${slug}`}
      className="group block h-full touch-manipulation rounded-[1.6rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
    >
      <article className="relative flex h-full min-h-[13rem] flex-col overflow-hidden rounded-[1.6rem] border border-slate-700/80 bg-slate-950 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.22)] transition duration-200 group-hover:-translate-y-1 group-hover:border-slate-500 group-hover:shadow-[0_24px_55px_rgba(2,6,23,0.32)] group-active:scale-[0.985]">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />

        <div className="relative flex items-start justify-between gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconAccent}`}>
            {icon}
          </div>
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-slate-300">
            <Smartphone size={12} />
            {interaction}
          </span>
        </div>

        <div className="relative mt-4 flex-1">
          <h3 className="text-xl font-black leading-tight text-white">{name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <div className="relative mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition group-hover:bg-cyan-200">
          <Play size={16} fill="currentColor" />
          Jouer maintenant
        </div>
      </article>
    </Link>
  );
}
