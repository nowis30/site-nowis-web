import Image from 'next/image';
import Link from 'next/link';
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
    <div className="bg-slate-50">
      <Script id={`song-schema-${song.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Nowis Morin</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-6xl">{song.title}</h1>
            {publishedAt ? <p className="mt-4 text-base font-medium text-slate-300">Sortie : {publishedAt}</p> : null}
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
              {song.description || 'Les données affichées sur cette page sont synchronisées depuis YouTube et Spotify lorsqu’elles sont disponibles.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {song.youtubeUrl ? (
                <a href={song.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700">
                  Voir sur YouTube
                </a>
              ) : null}
              {song.spotifyUrl ? (
                <a href={song.spotifyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600">
                  Écouter sur Spotify
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl aspect-square md:aspect-[4/3]">
              <Image src={song.coverImage} alt={song.title} fill className="object-cover" />
            </div>
            {song.spotifyUrl ? (
              <p className="text-sm text-slate-300">
                Spotify est affiché avec attribution et lien direct vers la plateforme, conformément à la demande.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Lecture et informations</h2>
            <dl className="mt-6 space-y-4 text-slate-600">
              <div>
                <dt className="font-semibold text-slate-950">Source</dt>
                <dd className="mt-1 capitalize">{song.source}</dd>
              </div>
              {publishedAt ? (
                <div>
                  <dt className="font-semibold text-slate-950">Date de publication</dt>
                  <dd className="mt-1">{publishedAt}</dd>
                </div>
              ) : null}
              {song.youtubeVideoId ? (
                <div>
                  <dt className="font-semibold text-slate-950">ID vidéo YouTube</dt>
                  <dd className="mt-1 break-all">{song.youtubeVideoId}</dd>
                </div>
              ) : null}
              {song.spotifyTrackId ? (
                <div>
                  <dt className="font-semibold text-slate-950">ID piste Spotify</dt>
                  <dd className="mt-1 break-all">{song.spotifyTrackId}</dd>
                </div>
              ) : null}
            </dl>
          </article>

          <article className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Continuer l’exploration</h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              La page musique se met à jour à partir du catalogue synchronisé. Si une nouvelle chanson est publiée sur YouTube ou Spotify, elle peut apparaître automatiquement après la synchronisation serveur.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/musique" className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">
                Retour à la musique
              </Link>
              <Link href="/contact" className="inline-flex rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Me contacter
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">Vidéo intégrée</h2>
          <div className="mt-6 overflow-hidden rounded-2xl bg-slate-100">
            {youtubeId ? (
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  title={`${song.title} - Nowis Morin`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-slate-500">
                Aucun lecteur YouTube disponible pour cette chanson pour le moment.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
