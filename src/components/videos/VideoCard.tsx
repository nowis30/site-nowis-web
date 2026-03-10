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
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <Image src={image} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-4 p-6">
        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">{category}</span>
        <div>
          <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-3 leading-relaxed text-slate-600">{shortDescription}</p>
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Voir sur YouTube
        </a>
      </div>
    </article>
  );
}
