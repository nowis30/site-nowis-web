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
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-card backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary-400/40 hover:shadow-fire">
      <div className="relative h-56 overflow-hidden bg-steel-900">
        <Image
          src={song.image}
          alt={song.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-coal-950 via-coal-950/10 to-transparent" />
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          {song.seoTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-primary-400/25 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-100">
              {tag}
            </span>
          ))}
        </div>
        <div>
          <h3 className="font-display text-4xl leading-none text-white">{song.title}</h3>
          {publishedAt ? <p className="mt-2 text-sm font-medium text-slate-400">{publishedAt}</p> : null}
          {song.shortDescription ? <p className="mt-3 leading-relaxed text-slate-300">{song.shortDescription}</p> : null}
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
              className="inline-flex items-center justify-center rounded-xl border border-secondary-400/40 bg-secondary-500/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary-600"
            >
              YouTube
            </a>
          ) : null}
          {song.spotifyUrl ? (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Spotify
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
