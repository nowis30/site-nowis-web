'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

type Props = { videoUrl?: string; posterUrl?: string; className?: string; muted?: boolean; loop?: boolean };

export function HeroVideoPlaceholder({ videoUrl, posterUrl = '/images/nowis-presentation.webp', className = '', muted = false, loop = false }: Props) {
  const [requestedUrl, setRequestedUrl] = useState('');
  const [failedUrl, setFailedUrl] = useState('');
  const url = videoUrl?.trim() || '';
  const activated = Boolean(url) && requestedUrl === url;
  const failed = Boolean(url) && failedUrl === url;

  return (
    <section className={`rounded-3xl border border-[color:var(--site-border)] bg-white/80 p-4 shadow-sm md:p-5 ${className}`} aria-label="Présentation vidéo">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--site-accent-strong)]">Rencontrez Nowis en vidéo</p>
      <div className="relative mt-3 overflow-hidden rounded-2xl bg-black">
        {failed || !url ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-4 p-5 text-center text-white" role="status">
            <p>La vidéo est indisponible pour le moment.</p>
            {url && <button type="button" className="rounded-xl bg-white px-5 py-3 font-semibold text-black" onClick={() => { setFailedUrl(''); setRequestedUrl(''); }}>Réessayer</button>}
            <Link href="/musique" className="underline">Écouter les chansons</Link>
          </div>
        ) : !activated ? (
          <button type="button" onClick={() => setRequestedUrl(url)} className="relative block aspect-video w-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-white" aria-label="Lire la présentation de Nowis avec le son">
            <Image src={posterUrl} alt="" fill sizes="(min-width: 1200px) 40vw, 100vw" className="object-contain" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 p-4">
              <span className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--site-heading)] shadow-lg"><PlayCircle aria-hidden="true" size={22} />Lire la présentation</span>
            </span>
          </button>
        ) : /youtube\.com|youtu\.be/i.test(url) ? (
          <iframe src={url} title="Vidéo de présentation Création Nowis" className="aspect-video w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <video key={url} className="aspect-video w-full object-contain" src={url} poster={posterUrl} controls preload="none" autoPlay playsInline muted={muted} loop={loop} aria-label="Vidéo de présentation Création Nowis" onError={() => setFailedUrl(url)}>
            Votre navigateur ne prend pas en charge cette vidéo.
          </video>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">La vidéo se charge uniquement lorsque vous choisissez de la lire.</p>
    </section>
  );
}
