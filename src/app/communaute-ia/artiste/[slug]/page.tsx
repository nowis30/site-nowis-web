import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildMetadata } from '@/lib/seo';

function sourceLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'la plateforme';
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const profile = await prisma.aiArtistProfile.findUnique({
    where: { slug: params.slug },
    select: { displayName: true, bio: true },
  });

  if (!profile) return buildMetadata({ title: 'Artiste introuvable | Communauté IA', description: 'Profil artiste introuvable.', path: '/communaute-ia' });

  return buildMetadata({
    title: `${profile.displayName} | Artiste de la communauté IA`,
    description: profile.bio || `Découvrez les créations musicales IA de ${profile.displayName}.`,
    path: `/communaute-ia/artiste/${params.slug}`,
  });
}

export default async function PublicAiArtistPage({ params }: { params: { slug: string } }) {
  const profile = await prisma.aiArtistProfile.findUnique({
    where: { slug: params.slug },
    select: {
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      createdAt: true,
      shares: {
        where: { isPublished: true, rightsConfirmed: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          aiTool: true,
          genre: true,
          listenUrl: true,
          coverUrl: true,
          description: true,
          createdAt: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });

  if (!profile) notFound();

  return (
    <article className="nm-page">
      <section className="nm-section">
        <Link className="nm-text-link" href="/communaute-ia">← Communauté musique IA</Link>

        <div className="brand-card mt-6 overflow-hidden rounded-[2rem]">
          <div className="relative h-48 bg-[color:var(--site-soft)] sm:h-64">
            {profile.bannerUrl ? (
              <Image src={profile.bannerUrl} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(184,111,61,.25),transparent_35%),linear-gradient(135deg,#f6eadc,#ead5bc)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>

          <div className="relative p-6 pt-16 sm:p-8 sm:pt-20">
            <div className="absolute -top-14 left-6 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[color:var(--site-soft)] shadow-lg sm:left-8">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={`Photo de ${profile.displayName}`} fill sizes="112px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-bold text-[color:var(--site-accent-strong)]">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <p className="nm-eyebrow">Artiste de la communauté</p>
            <h1 className="mt-2 font-display text-4xl text-[color:var(--site-heading)] sm:text-5xl">{profile.displayName}</h1>
            {profile.bio ? <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-8 text-[color:var(--site-muted)]">{profile.bio}</p> : null}
            <p className="mt-4 text-sm text-[color:var(--site-soft)]">{profile.shares.length} création{profile.shares.length === 1 ? '' : 's'} publiée{profile.shares.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </section>

      <section className="nm-section">
        <p className="nm-eyebrow">Musique</p>
        <h2 className="font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Toutes les créations</h2>

        {profile.shares.length === 0 ? (
          <p className="mt-7 rounded-2xl border border-dashed border-[color:var(--site-border)] p-7 text-[color:var(--site-muted)]">
            Aucune chanson publiée pour le moment.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {profile.shares.map((share) => (
              <article key={share.id} className="brand-card overflow-hidden rounded-[1.75rem]">
                <div className="relative aspect-square bg-[color:var(--site-soft)]">
                  {share.coverUrl ? (
                    <Image src={share.coverUrl} alt={`Pochette de ${share.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(184,111,61,.2),transparent_35%),linear-gradient(135deg,#f8efe5,#ead8c5)] text-5xl" aria-hidden="true">♪</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[color:var(--site-soft)] px-3 py-1 text-xs font-semibold">{share.aiTool}</span>
                    {share.genre ? <span className="rounded-full border border-[color:var(--site-border)] px-3 py-1 text-xs">{share.genre}</span> : null}
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)]">{share.title}</h3>
                  {share.description ? <p className="mt-3 line-clamp-4 text-sm leading-6 text-[color:var(--site-muted)]">{share.description}</p> : null}
                  <p className="mt-4 text-sm text-[color:var(--site-muted)]">❤️ {share._count.likes} · 💬 {share._count.comments}</p>
                  <a href={share.listenUrl} target="_blank" rel="noopener noreferrer nofollow"
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-2.5 text-sm font-semibold">
                    Écouter sur {sourceLabel(share.listenUrl)} ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
