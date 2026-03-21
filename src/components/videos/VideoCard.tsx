'use client';

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
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-card backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary-400/40 hover:shadow-fire">
      <div className="relative h-56 overflow-hidden bg-steel-900">
        <Image src={image} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal-950 via-coal-950/10 to-transparent" />
      </div>
      <div className="space-y-5 p-7">
        <span className="inline-flex rounded-full border border-primary-400/25 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-100">{category}</span>
        <div>
          <h3 className="font-display text-3xl leading-[1.08] text-white md:text-[2rem]">{title}</h3>
          <p className="mt-3 text-base leading-7 text-slate-200">{shortDescription}</p>
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-sm font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Voir sur YouTube
        </a>
      </div>
    </article>
  );
}
