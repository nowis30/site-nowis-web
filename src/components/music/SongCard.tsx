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
    <article className="group glass-panel-soft overflow-hidden rounded-3xl border border-[var(--site-border)] shadow-card transition hover:-translate-y-1 hover:border-[color:var(--site-accent)]/50 hover:shadow-fire">
      <div className="relative h-56 overflow-hidden bg-[var(--site-soft)]">
        <Image
          src={song.image}
          alt={song.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(53,35,23,0.55)] via-[rgba(53,35,23,0.08)] to-transparent" />
      </div>
      <div className="space-y-5 p-7">
        <div className="flex flex-wrap gap-2">
          {song.seoTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-[color:var(--site-accent)]/20 bg-[color:var(--site-accent-soft)] px-3 py-1 text-xs font-medium text-[color:var(--site-accent-strong)]">
              {tag}
            </span>
          ))}
        </div>
        <div>
          <h3 className="font-display text-3xl leading-[1.08] text-[color:var(--site-heading)] md:text-[2rem]">{song.title}</h3>
          {publishedAt ? <p className="mt-2 text-sm font-medium text-[color:var(--site-muted)]">{publishedAt}</p> : null}
          {song.shortDescription ? <p className="mt-3 text-base leading-7 text-[color:var(--site-text)]">{song.shortDescription}</p> : null}
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
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-5 py-3 text-sm font-semibold text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)]/40 hover:bg-[color:var(--site-accent-soft)]"
            >
              YouTube
            </a>
          ) : null}
          {song.spotifyUrl ? (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)]/40 hover:bg-white"
            >
              Spotify
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
