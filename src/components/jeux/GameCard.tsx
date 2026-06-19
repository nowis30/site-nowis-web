'use client';

import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import type { GameEntry } from './gameCatalog';

type GameCardProps = GameEntry & {
  index: number;
  icon: React.ReactNode;
  description: string;
};

const colorSchemes = [
  { bg: 'bg-sky-500/14', border: 'border-sky-300/35', hover: 'bg-sky-500/20', accent: 'bg-sky-200', text: 'text-sky-100' },
  { bg: 'bg-cyan-500/14', border: 'border-cyan-300/35', hover: 'bg-cyan-500/20', accent: 'bg-cyan-200', text: 'text-cyan-100' },
  { bg: 'bg-blue-500/14', border: 'border-blue-300/35', hover: 'bg-blue-500/20', accent: 'bg-blue-200', text: 'text-blue-100' },
  { bg: 'bg-indigo-500/14', border: 'border-indigo-300/35', hover: 'bg-indigo-500/20', accent: 'bg-indigo-200', text: 'text-indigo-100' },
];

const glowColors = [
  'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
  'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]',
  'group-hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]',
  'group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]',
];

export function GameCard({ index, slug, name, icon, description }: GameCardProps) {
  const scheme = colorSchemes[index % 4];
  const glow = glowColors[index % 4];

  return (
    <Link href={`/jeux/${slug}`}>
      <article className={`group relative h-full overflow-hidden rounded-[1.5rem] border ${scheme.border} ${scheme.bg} backdrop-blur-sm p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:${scheme.hover} cursor-pointer ${glow}`}>
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20 bg-gradient-to-br from-white/0 via-white/0 to-white/5`} />

        {/* Icon + Title section */}
        <div className="relative mb-4 flex items-start gap-4">
          <div className={`flex items-center justify-center rounded-xl ${scheme.accent} p-3 text-yellow-500 shadow-[0_4px_12px_rgba(0,0,0,0.2)]`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-yellow-500 md:text-xl leading-tight">{name}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-yellow-500 leading-relaxed mb-5 line-clamp-2 group-hover:text-yellow-400 transition-colors">
          {description}
        </p>

        {/* Play button */}
        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-xs font-black text-sky-900 transition-all duration-300 group-hover:from-yellow-200 group-hover:to-amber-200 inline-flex">
          <PlayCircle size={14} />
          Jouer
        </div>

        {/* Accent line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${scheme.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
      </article>
    </Link>
  );
}
