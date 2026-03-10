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
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <Image
          src={song.image}
          alt={song.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          {song.seoTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {tag}
            </span>
          ))}
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-slate-950">{song.title}</h3>
          {publishedAt ? <p className="mt-2 text-sm font-medium text-slate-500">{publishedAt}</p> : null}
          {song.shortDescription ? <p className="mt-3 leading-relaxed text-slate-600">{song.shortDescription}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/chanson/${song.slug}`}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Voir la chanson
          </Link>
          {song.youtubeUrl ? (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              YouTube
            </a>
          ) : null}
          {song.spotifyUrl ? (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Spotify
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
