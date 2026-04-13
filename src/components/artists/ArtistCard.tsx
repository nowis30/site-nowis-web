import Link from 'next/link';
import Image from 'next/image';
import type { ArtistProfile } from '@/data/artists';

export function ArtistCard({ artist }: { artist: ArtistProfile }) {
  const hasImage = Boolean(artist.image?.src);

  return (
    <Link
      href={`/artistes/${artist.slug}`}
      className="group glass-panel-soft overflow-hidden rounded-[2rem] border border-[var(--site-border)] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-72 overflow-hidden bg-[var(--site-soft)]">
        {hasImage ? (
          <>
            <Image
              src={artist.image!.src}
              alt={artist.image!.alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(53,35,23,0.55)] via-[rgba(53,35,23,0.18)] to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(183,141,92,0.28),_transparent_30%),linear-gradient(180deg,#fbf4ea_0%,#f2e2cb_100%)]" />
        )}

      </div>

      <div className="space-y-5 p-6 md:p-8">
        <p className="text-base leading-8 text-slate-700">{artist.cardSummary}</p>

        <div className="flex flex-wrap gap-2">
          {artist.heroHighlights.map((highlight) => (
            <span key={highlight} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {highlight}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-950">
          <span>Découvrir l’artiste</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}
