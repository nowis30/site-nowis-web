import Image from 'next/image';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getSongBySlug } from '@/data/songs';
import { buildMetadata, extractYouTubeVideoId } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

function formatPublishedAt(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(date);
}

function toAbsoluteImageUrl(image: string) {
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return `https://nowis.store${image.startsWith('/') ? image : `/${image}`}`;
}

export async function generateMetadata({ params }: PageProps) {
  const song = await getSongBySlug(params.slug);

  if (!song) {
    return buildMetadata({
      title: 'Chanson introuvable — Nowis Morin',
      description: 'La chanson demandée est introuvable.',
      path: `/chanson/${params.slug}`,
    });
  }

  const description = song.description?.trim() || `Découvre ${song.title}, une chanson de Nowis Morin disponible sur YouTube${song.spotifyUrl ? ' et Spotify' : ''}.`;

  return buildMetadata({
    title: `${song.title} – chanson de Nowis Morin`,
    description,
    path: `/chanson/${song.slug}`,
    image: song.coverImage,
    keywords: [...song.seoTags, song.title],
  });
}

export default async function ChansonPage({ params }: PageProps) {
  const song = await getSongBySlug(params.slug);
  if (!song) notFound();

  const youtubeId = extractYouTubeVideoId(song.youtubeUrl);
  const publishedAt = formatPublishedAt(song.publishedAt);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.title,
    byArtist: {
      '@type': 'MusicGroup',
      name: 'Nowis Morin',
    },
    description: song.description || undefined,
    datePublished: song.publishedAt || undefined,
    url: `https://nowis.store/chanson/${song.slug}`,
    image: toAbsoluteImageUrl(song.coverImage),
    sameAs: [song.youtubeUrl, song.spotifyUrl].filter(Boolean),
  };

  return (
    <div className="site-background text-[color:var(--site-text)]">
      <Script id={`song-schema-${song.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="section-warm">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Nowis Morin</p>
            <h1 className="mt-5 font-display text-4xl leading-tight text-[color:var(--site-heading)] md:text-6xl">{song.title}</h1>
            {publishedAt ? <p className="mt-4 text-base font-medium text-[color:var(--site-muted)]">Sortie : {publishedAt}</p> : null}
            <p className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--site-text)] sm:text-lg">
              {song.description || 'Découvre cette chanson de Nowis Morin et accède directement aux plateformes officielles lorsqu’elles sont disponibles.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {song.youtubeUrl ? (
                <a
                  href={song.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Voir ${song.title} sur YouTube (nouvel onglet)`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-warm px-6 py-3 text-base font-semibold text-white shadow-fire motion-safe:transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/50 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Voir sur YouTube
                </a>
              ) : null}
              {song.spotifyUrl ? (
                <a
                  href={song.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Écouter ${song.title} sur Spotify (nouvel onglet)`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-6 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-[color:var(--site-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
                >
                  Écouter sur Spotify
                </a>
              ) : null}
              {song.otherStreamUrl ? (
                <a
                  href={song.otherStreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Écouter ${song.title} sur une autre plateforme (nouvel onglet)`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white/80 px-6 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
                >
                  Autre plateforme
                </a>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="brand-card relative aspect-square overflow-hidden rounded-[1.75rem] shadow-card md:aspect-[4/3]">
              <Image
                src={song.coverImage}
                alt={song.title}
                fill
                sizes="(min-width: 768px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
            {song.spotifyUrl ? (
              <p className="text-sm leading-6 text-[color:var(--site-muted)]">
                Accès direct vers les plateformes officielles pour écouter la chanson dans le bon contexte.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <article aria-labelledby="song-about-title" className="brand-card rounded-[1.75rem] p-6 sm:p-8">
            <h2 id="song-about-title" className="font-display text-2xl text-[color:var(--site-heading)]">À propos de cette chanson</h2>
            <div className="mt-6 space-y-5 text-[color:var(--site-muted)]">
              <p className="leading-7">
                Cette page présente la chanson avec ses liens d’écoute et une version plus claire de sa description, afin d’offrir une lecture simple et agréable aux visiteurs.
              </p>
              {publishedAt ? (
                <div>
                  <p className="font-semibold text-[color:var(--site-heading)]">Date de publication</p>
                  <p className="mt-1">{publishedAt}</p>
                </div>
              ) : null}
              {(song.youtubeUrl || song.spotifyUrl || song.otherStreamUrl) ? (
                <div>
                  <p className="font-semibold text-[color:var(--site-heading)]">Plateformes disponibles</p>
                  <p className="mt-1">
                    {[song.youtubeUrl ? 'YouTube' : null, song.spotifyUrl ? 'Spotify' : null, song.otherStreamUrl ? 'Autre plateforme' : null]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
              ) : null}
            </div>
          </article>

          <article aria-labelledby="song-next-title" className="warm-spotlight-panel rounded-[1.75rem] p-6 sm:p-8">
            <h2 id="song-next-title" className="font-display text-2xl text-[color:var(--site-heading)]">Continuer l’exploration</h2>
            <p className="mt-4 leading-7 text-[color:var(--site-text)]">
              Continue l’exploration du catalogue musical, découvre d’autres chansons et contacte Création Nowis si tu veux transformer une idée ou une histoire en projet sur mesure.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/musique"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white/85 px-5 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
              >
                Retour à la musique
              </Link>
              <ContactPrefillLink
                href="/contact?projectType=chanson&message=Bonjour, je veux discuter d’une chanson personnalisée ou d’un projet musical avec Création Nowis."
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-5 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
              >
                Contacter Création Nowis
              </ContactPrefillLink>
            </div>
          </article>
        </div>

        <section aria-labelledby="song-video-title" className="brand-card mt-8 rounded-[1.75rem] p-5 sm:mt-10 sm:p-6">
          <h2 id="song-video-title" className="font-display text-2xl text-[color:var(--site-heading)]">Vidéo intégrée</h2>
          <div className="mt-6 overflow-hidden rounded-2xl bg-[color:var(--site-soft)]">
            {youtubeId ? (
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  title={`${song.title} - Nowis Morin`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-[color:var(--site-muted)]">
                Aucun lecteur YouTube disponible pour cette chanson pour le moment.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
