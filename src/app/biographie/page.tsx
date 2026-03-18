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
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Biographie"
        title="Nowis Morin : une démarche musicale guidée par l’émotion, la mémoire et la création"
        description={artist.shortBio}
        primaryCta={{ label: 'Écouter ma musique', href: '/musique' }}
        secondaryCta={{ label: 'Parler de mon projet', href: artist.contactHref }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Parcours</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950">Une biographie ancrée dans le vrai</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
              {artist.longBio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Repères</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-200">
                {artist.heroHighlights.map((item) => (
                  <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Plateformes</p>
              <h2 className="mt-4 text-2xl font-bold text-slate-950">Suivre Nowis Morin</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Retrouve les sorties, les vidéos et les nouvelles créations sur les plateformes principales.
              </p>
              <div className="mt-6 grid gap-3">
                {platformLinks.map((platform) => (
                  <Link
                    key={platform.label}
                    href={platform.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:text-emerald-700"
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

      <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Vision</p>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Une approche artistique qui utilise l’IA sans perdre l’humain</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              {artist.journey.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <article className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Créer ensemble</p>
            <h2 className="mt-4 text-2xl font-bold">Des chansons et projets sur mesure pour des moments qui comptent</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{artist.customCreationsIntro[0]}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {artist.customCreationsExamples.map((example) => (
                <span key={example} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {example}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-300">{artist.pricingNote}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <ContactPrefillLink
                href={artist.contactHref}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Contacter Création Nowis
              </ContactPrefillLink>
              <Link
                href="/artistes/nowis-morin"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Voir la page artiste complète
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
