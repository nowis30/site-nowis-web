'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Song } from '@/data/songs';

function formatPublishedAt(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(date);
}

export function SongCard({ song }: { song: Song }) {
  const publishedAt = formatPublishedAt(song.publishedAt);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] shadow-card backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary-400/40 hover:shadow-fire">
      <div className="relative h-56 overflow-hidden bg-steel-900">
        <Image
          src={song.image}
          alt={song.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-coal-950 via-coal-950/10 to-transparent" />
      </div>
      <div className="space-y-5 p-7">
        <div className="flex flex-wrap gap-2">
          {song.seoTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-primary-400/25 bg-primary-500/12 px-3 py-1 text-xs font-medium text-primary-100">
              {tag}
            </span>
          ))}
        </div>
        <div>
          <h3 className="font-display text-3xl leading-[1.08] text-white md:text-[2rem]">{song.title}</h3>
          {publishedAt ? <p className="mt-2 text-sm font-medium text-slate-300">{publishedAt}</p> : null}
          {song.shortDescription ? <p className="mt-3 text-base leading-7 text-slate-200">{song.shortDescription}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/chanson/${song.slug}`}
            className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-sm font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Voir la chanson
          </Link>
          {song.youtubeUrl ? (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-secondary-400/40 bg-secondary-500/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary-500"
            >
              YouTube
            </a>
          ) : null}
          {song.spotifyUrl ? (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/45 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Spotify
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
