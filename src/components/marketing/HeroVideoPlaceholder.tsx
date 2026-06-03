"use client";

import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';

type HeroVideoPlaceholderProps = {
  videoUrl?: string;
  className?: string;
};

function isYouTubeUrl(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

export function HeroVideoPlaceholder({ videoUrl, className }: HeroVideoPlaceholderProps) {
  const normalizedVideoUrl = videoUrl?.trim() || '';
  const hasVideo = normalizedVideoUrl.length > 0;
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  useEffect(() => {
    setVideoUnavailable(false);
  }, [normalizedVideoUrl]);
  const sectionClassName = [
    'rounded-3xl border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,238,226,0.95))] p-4 shadow-sm md:p-5',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={sectionClassName}
      aria-label="Présentation vidéo"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Présentation vidéo</p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--site-border)] bg-[radial-gradient(circle_at_15%_18%,rgba(184,111,61,0.2),transparent_35%),radial-gradient(circle_at_82%_16%,rgba(203,165,120,0.22),transparent_30%),linear-gradient(180deg,#fef9f3_0%,#f4e9da_100%)]">
        {/* TODO: Remplacer ce placeholder par la vidéo IA de présentation. */}
        {/* Pour remplacer la vidéo d’intro, déposer le fichier dans public/videos/intro.mp4 ou définir NEXT_PUBLIC_HOME_INTRO_VIDEO_URL avec une URL publique. */}
        {hasVideo && !videoUnavailable ? (
          isYouTubeUrl(normalizedVideoUrl) ? (
            <iframe
              className="aspect-video w-full"
              src={normalizedVideoUrl}
              title="Vidéo de présentation Création Nowis"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              className="aspect-video w-full"
              controls
              preload="metadata"
              onError={() => setVideoUnavailable(true)}
            >
              <source
                src={normalizedVideoUrl}
                onError={() => setVideoUnavailable(true)}
              />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )
        ) : (
          <div className="aspect-video w-full">
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <PlayCircle size={52} className="text-[color:var(--site-accent-strong)]" />
              <p className="mt-3 text-base font-semibold text-[color:var(--site-heading)] md:text-lg">Espace vidéo de présentation</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[color:var(--site-muted)]">
                {hasVideo
                  ? 'Vidéo introuvable pour le moment. Dépose le fichier dans public/videos/intro.mp4 ou définis une URL publique valide.'
                  : 'Intègre ici ta vidéo IA plus tard: fichier local, URL S3 ou vidéo YouTube intégrée.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
