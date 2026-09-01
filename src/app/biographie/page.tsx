import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { PageHero } from '@/components/marketing/PageHero';
import { socialLinks } from '@/config/socialLinks';
import { getArtistBySlug } from '@/data/artists';
import { buildMetadata } from '@/lib/seo';

const artist = getArtistBySlug('nowis-morin');

export const metadata = buildMetadata({
  title: 'Biographie | Nowis Morin',
  description:
    artist?.seoDescription ||
    'Découvre la biographie de Nowis Morin, son parcours musical et sa manière de créer des chansons et projets visuels avec sensibilité.',
  path: '/biographie',
  keywords: ['biographie Nowis Morin', 'artiste Québec', 'Création Nowis', 'chansons personnalisées'],
});

const platformLinks = [
  { label: 'Spotify', href: socialLinks.spotify },
  { label: 'YouTube', href: socialLinks.youtube },
  { label: 'Instagram', href: socialLinks.instagram },
  { label: 'Facebook', href: socialLinks.facebook },
];

export default function BiographiePage() {
  if (!artist) {
    return null;
  }

  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Biographie"
        title="Nowis Morin : une démarche musicale guidée par l’émotion, la mémoire et la création"
        description={artist.shortBio}
        primaryCta={{ label: 'Écouter ma musique', href: '/musique' }}
        secondaryCta={{ label: 'Parler de mon projet', href: artist.contactHref }}
      />

      <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:gap-8">
          <article className="brand-card p-7 sm:p-8 md:p-10">
            <span className="brand-chip inline-flex">Parcours</span>
            <h2 className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
              Une biographie ancrée dans le vrai
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[color:var(--site-muted)]">
              {artist.longBio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="warm-spotlight-panel p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Repères</p>
              <ul className="mt-5 space-y-3 text-sm text-[color:var(--site-text)]">
                {artist.heroHighlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-[color:var(--site-accent)]/15 bg-white/70 px-4 py-3 leading-6"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="brand-card p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Plateformes</p>
              <h2 className="mt-4 font-display text-2xl text-[color:var(--site-heading)]">Suivre Nowis Morin</h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">
                Retrouve les sorties, les vidéos et les nouvelles créations sur les plateformes principales.
              </p>
              <div className="mt-6 grid gap-3">
                {platformLinks.map((platform) => (
                  <Link
                    key={platform.label}
                    href={platform.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${platform.label} — ouvrir dans un nouvel onglet`}
                    className="cta-secondary inline-flex min-h-11 items-center justify-between gap-4 px-4 py-3 text-sm font-semibold"
                  >
                    <span>{platform.label}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-soft px-6 py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 lg:gap-8">
          <article className="brand-card p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-400">Vision</p>
            <h2 className="mt-4 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
              Une approche artistique qui utilise l’IA sans perdre l’humain
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[color:var(--site-muted)] sm:text-base">
              {artist.journey.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <article className="warm-cta-panel p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Créer ensemble</p>
            <h2 className="mt-4 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
              Des chansons et projets sur mesure pour des moments qui comptent
            </h2>
            <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)] sm:text-base">
              {artist.customCreationsIntro[0]}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {artist.customCreationsExamples.map((example) => (
                <span
                  key={example}
                  className="rounded-full border border-[color:var(--site-accent)]/15 bg-white/70 px-4 py-2 text-sm text-[color:var(--site-text)]"
                >
                  {example}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-[color:var(--site-muted)]">{artist.pricingNote}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ContactPrefillLink href={artist.contactHref} className="cta-primary w-full px-6 py-3 sm:w-auto">
                Contacter Création Nowis
              </ContactPrefillLink>
              <Link href="/artistes/nowis-morin" className="cta-secondary w-full px-6 py-3 sm:w-auto">
                Voir la page artiste complète
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
