'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { extractYouTubeVideoId } from '@/lib/seo';

export type HomepageMediaItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  posterSrc: string;
  posterAlt: string;
  href: string;
  ctaLabel: string;
  videoUrl?: string;
};

type HomepageMediaShowcaseProps = {
  featured: HomepageMediaItem;
  items: HomepageMediaItem[];
};

function buildEmbedUrl(youtubeUrl?: string) {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

export function HomepageMediaShowcase({ featured, items }: HomepageMediaShowcaseProps) {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const activeEmbedUrl = useMemo(() => buildEmbedUrl(activeVideoUrl || undefined), [activeVideoUrl]);

  return (
    <section id="exemples" className="section-soft px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Exemples et usages</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Voir concrètement ce que le visiteur peut vivre, offrir ou lancer
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Une présentation plus visuelle des cas d&apos;usage qui parlent le plus vite aux familles, aux organismes, aux écoles et aux personnes qui veulent une chanson marquante.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="glass-panel-strong overflow-hidden p-4 md:p-5">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
              <div className="relative overflow-hidden rounded-[1.75rem] min-h-[320px] md:min-h-[420px]">
                <Image
                  src={featured.posterSrc}
                  alt={featured.posterAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 hero-overlay-warm" />
                {featured.videoUrl ? (
                  <button
                    type="button"
                    className="absolute bottom-4 left-4 inline-flex items-center gap-3 rounded-full bg-[rgba(255,255,255,0.92)] px-4 py-3 text-sm font-semibold text-[color:var(--site-heading)] shadow-lg transition hover:bg-white"
                    onClick={() => setActiveVideoUrl(featured.videoUrl || null)}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--site-accent)] text-white">▶</span>
                    Voir l&apos;exemple
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col justify-between gap-6 p-2 md:p-3">
                <div>
                  <span className="brand-chip">{featured.eyebrow}</span>
                  <h3 className="mt-5 font-display text-3xl leading-[1.04] text-[color:var(--site-heading)] md:text-4xl">
                    {featured.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
                    {featured.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3">
                    {[
                      'Approche simple, douce et humaine',
                      'Résultat concret qui donne envie d’agir',
                      'Présence réelle de Nowis Morin à chaque étape',
                    ].map((item) => (
                      <div key={item} className="glass-panel-soft flex items-start gap-3 rounded-[1.25rem] px-4 py-3">
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--site-accent-soft)] text-xs font-bold text-[color:var(--site-accent-strong)]">✓</span>
                        <span className="text-sm leading-6 text-[color:var(--site-text)]">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={featured.href} className="cta-primary">
                      {featured.ctaLabel}
                    </Link>
                    {featured.videoUrl ? (
                      <button
                        type="button"
                        className="cta-secondary"
                        onClick={() => setActiveVideoUrl(featured.videoUrl || null)}
                      >
                        Lancer la vidéo
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="glass-panel-soft overflow-hidden p-4">
                <div className="relative overflow-hidden rounded-[1.5rem] aspect-[16/11]">
                  <Image
                    src={item.posterSrc}
                    alt={item.posterAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="pointer-events-none absolute inset-0 hero-overlay-warm" />
                  {item.videoUrl ? (
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-[color:var(--site-heading)] shadow-lg transition hover:bg-white"
                      onClick={() => setActiveVideoUrl(item.videoUrl || null)}
                      aria-label={`Lire ${item.title}`}
                    >
                      ▶
                    </button>
                  ) : null}
                </div>
                <div className="space-y-4 px-2 pb-2 pt-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">
                    {item.eyebrow}
                  </span>
                  <h3 className="font-display text-2xl leading-[1.04] text-[color:var(--site-heading)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-7 text-[color:var(--site-muted)]">
                    {item.description}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link href={item.href} className="cta-primary w-full">
                      {item.ctaLabel}
                    </Link>
                    {item.videoUrl ? (
                      <button
                        type="button"
                        className="cta-secondary w-full"
                        onClick={() => setActiveVideoUrl(item.videoUrl || null)}
                      >
                        Voir l&apos;exemple
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {activeEmbedUrl ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(31,21,15,0.72)] p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[rgba(255,255,255,0.18)] bg-black shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-[color:var(--site-heading)]"
              onClick={() => setActiveVideoUrl(null)}
              aria-label="Fermer la vidéo"
            >
              ✕
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={activeEmbedUrl}
                title="Exemple vidéo Création Nowis"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}