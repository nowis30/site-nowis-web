import Image from 'next/image';
import Link from 'next/link';
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
    <article className="group brand-card overflow-hidden rounded-[1.75rem] motion-safe:transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-fire">
      <div className="relative h-56 overflow-hidden bg-[var(--site-soft)]">
        <Image
          src={song.image}
          alt={song.title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(53,35,23,0.55)] via-[rgba(53,35,23,0.08)] to-transparent" />
      </div>
      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap gap-2">
          {song.seoTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--site-accent)]/20 bg-[color:var(--site-accent-soft)] px-3 text-xs font-medium text-[color:var(--site-accent-strong)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div>
          <h3 className="font-display text-3xl leading-[1.08] text-[color:var(--site-heading)] md:text-[2rem]">{song.title}</h3>
          {publishedAt ? <p className="mt-2 text-sm font-medium text-[color:var(--site-muted)]">{publishedAt}</p> : null}
          {song.shortDescription ? <p className="mt-3 text-base leading-7 text-[color:var(--site-text)]">{song.shortDescription}</p> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/chanson/${song.slug}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-base font-semibold text-white shadow-fire motion-safe:transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/50 focus-visible:ring-offset-2 sm:w-auto"
          >
            Voir la chanson
          </Link>
          {song.youtubeUrl ? (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Écouter ${song.title} sur YouTube (nouvel onglet)`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-5 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-[color:var(--site-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
            >
              YouTube
            </a>
          ) : null}
          {song.spotifyUrl ? (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Écouter ${song.title} sur Spotify (nouvel onglet)`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white/80 px-5 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
            >
              Spotify
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
