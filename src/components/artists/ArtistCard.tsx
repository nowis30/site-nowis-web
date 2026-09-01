import Image from 'next/image';
import Link from 'next/link';
import type { ArtistProfile } from '@/data/artists';

export function ArtistCard({ artist }: { artist: ArtistProfile }) {
  const hasImage = Boolean(artist.image?.src);

  return (
    <Link
      href={`/artistes/${artist.slug}`}
      className="group brand-card block overflow-hidden rounded-[2rem] motion-safe:transition motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
    >
      <div className="relative h-72 overflow-hidden bg-[color:var(--site-soft)] sm:h-80">
        {hasImage ? (
          <>
            <Image
              src={artist.image!.src}
              alt={artist.image!.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(53,35,23,0.55)] via-[rgba(53,35,23,0.18)] to-transparent" />
          </>
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(183,141,92,0.28),_transparent_30%),linear-gradient(180deg,#fbf4ea_0%,#f2e2cb_100%)]" />
        )}
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">{artist.role}</p>
          <h3 className="mt-2 font-display text-3xl text-[color:var(--site-heading)]">{artist.name}</h3>
        </div>

        <p className="text-base leading-8 text-[color:var(--site-muted)]">{artist.cardSummary}</p>

        <div className="flex flex-wrap gap-2" aria-label={`Repères artistiques de ${artist.name}`}>
          {artist.heroHighlights.map((highlight) => (
            <span key={highlight} className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-soft)] px-3 py-1.5 text-xs font-medium text-[color:var(--site-text)]">
              {highlight}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[color:var(--site-border)] pt-4 text-sm font-semibold text-[color:var(--site-heading)]">
          <span>Découvrir l’artiste</span>
          <span aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}
