import Image from 'next/image';

type VideoCardProps = {
  title: string;
  image: string;
  shortDescription: string;
  youtubeUrl: string;
  category: string;
};

export function VideoCard({ title, image, shortDescription, youtubeUrl, category }: VideoCardProps) {
  return (
    <article className="group brand-card overflow-hidden rounded-[1.75rem] motion-safe:transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-fire">
      <div className="relative h-56 overflow-hidden bg-[var(--site-soft)]">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(53,35,23,0.55)] via-[rgba(53,35,23,0.08)] to-transparent" />
      </div>
      <div className="space-y-5 p-5 sm:p-7">
        <span className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--site-accent)]/20 bg-[color:var(--site-accent-soft)] px-3 text-xs font-semibold text-[color:var(--site-accent-strong)]">
          {category}
        </span>
        <div>
          <h3 className="font-display text-3xl leading-[1.08] text-[color:var(--site-heading)] md:text-[2rem]">{title}</h3>
          <p className="mt-3 text-base leading-7 text-[color:var(--site-text)]">{shortDescription}</p>
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Voir ${title} sur YouTube (nouvel onglet)`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-base font-semibold text-white shadow-fire motion-safe:transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/50 focus-visible:ring-offset-2 sm:w-auto"
        >
          Voir sur YouTube
        </a>
      </div>
    </article>
  );
}
