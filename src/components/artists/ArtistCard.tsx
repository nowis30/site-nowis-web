import Link from 'next/link';
import Image from 'next/image';
import type { ArtistProfile } from '@/data/artists';

export function ArtistCard({ artist }: { artist: ArtistProfile }) {
  const hasImage = Boolean(artist.image?.src);

  return (
    <Link
      href={`/artistes/${artist.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-72 overflow-hidden bg-slate-950">
        {hasImage ? (
          <>
            <Image
              src={artist.image!.src}
              alt={artist.image!.alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
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
