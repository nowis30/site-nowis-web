import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { serviceOffers } from '@/data/serviceOffers';
import { buildMetadata } from '@/lib/seo';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';

const hourlyRegularPrice = REGULAR_PRICES.hourly;
const memorySongRegularPrice = REGULAR_PRICES.songs.memorySong;
const songVideoRegularPrice = REGULAR_PRICES.songs.videoWithSong;

const offerIcons = ['🎵', '🎬', '🎨', '💡'];

export const metadata = buildMetadata({
  title: 'Services créatifs — Création Nowis | Chansons personnalisées, vidéos IA et concepts sur mesure',
  description:
    'Découvrez les services créatifs de Création Nowis : chansons personnalisées, vidéos IA, visuels et concepts sur mesure à Drummondville et partout au Québec.',
  path: '/services',
  keywords: ['services Création Nowis', 'chanson personnalisée Québec', 'vidéo IA Drummondville', 'concept créatif avec IA'],
});

export default function ServicesPage() {
  return (
    <main className="site-background text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Services / Collaborations"
        title="Transformer une idée en projet créatif clair, moderne et mémorable"
        description={`Création Nowis accompagne les projets qui ont besoin d’une chanson personnalisée, d’une vidéo IA, d’un visuel ou d’une direction créative structurée. Tarif horaire régulier : ${formatPrice(hourlyRegularPrice, ' / h')}. Les projets spéciaux sont établis sur soumission selon les livrables.`}
        primaryCta={{
          label: 'Parler de mon projet',
          href: '/contact?projectType=autre&message=Bonjour, je veux discuter d’un projet créatif avec Création Nowis.',
        }}
        secondaryCta={{ label: 'Écouter mes chansons', href: '/musique' }}
      />

      <section className="mx-auto max-w-7xl px-6 pb-6 pt-2 md:pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-panel-soft p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">Accompagnement</p>
            <p className="mt-2 font-display text-3xl text-[color:var(--site-heading)]">{formatPrice(hourlyRegularPrice, ' / h')}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Pour les mandats qui suivent une logique horaire.</p>
          </div>
          <div className="glass-panel-soft p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">Chanson souvenir</p>
            <p className="mt-2 font-display text-3xl text-[color:var(--site-heading)]">{formatPrice(memorySongRegularPrice)}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Une création personnalisée pour raconter un moment qui compte.</p>
          </div>
          <div className="glass-panel-soft p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">Vidéo IA + chanson</p>
            <p className="mt-2 font-display text-3xl text-[color:var(--site-heading)]">{formatPrice(songVideoRegularPrice)}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">Une expérience visuelle et sonore réunie dans un même projet.</p>
          </div>
        </div>
      </section>

      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ce que je peux créer avec vous</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl font-display text-4xl leading-[1.04] text-[color:var(--site-heading)] md:text-5xl">
              Quatre portes d’entrée, une même direction créative
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
              Chaque offre garde son objectif propre, mais toutes suivent la même méthode : comprendre le besoin, proposer une direction simple, produire avec soin et livrer quelque chose d’utilisable.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {serviceOffers.map((offer, index) => (
              <article key={offer.title} className="brand-card group flex h-full flex-col p-7 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/70 text-2xl shadow-sm"
                    role="img"
                    aria-hidden="true"
                  >
                    {offerIcons[index] ?? '✨'}
                  </span>
                  <span className="brand-chip">Création sur mesure</span>
                </div>

                <h3 className="mt-6 font-display text-3xl leading-tight text-[color:var(--site-heading)]">{offer.title}</h3>
                <p className="mt-3 font-semibold leading-7 text-emerald-600">{offer.subtitle}</p>
                <p className="mt-4 leading-7 text-[color:var(--site-muted)]">{offer.description}</p>

                <ul className="mt-6 grid gap-2.5 text-sm text-[color:var(--site-muted)] sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {offer.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 leading-6">
                      <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-[10px] font-black text-primary-400" aria-hidden="true">
                        ✓
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  {offer.href.startsWith('/contact') ? (
                    <ContactPrefillLink href={offer.href} className="cta-secondary w-full justify-center px-5 py-3 text-sm sm:w-auto">
                      {offer.cta}
                    </ContactPrefillLink>
                  ) : (
                    <Link href={offer.href} className="cta-secondary w-full justify-center px-5 py-3 text-sm sm:w-auto">
                      {offer.cta}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="warm-spotlight-panel p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <span className="text-4xl" role="img" aria-hidden="true">🧭</span>
              <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">Pas certain du bon format?</h2>
            </div>
            <div>
              <p className="leading-8 text-[color:var(--site-muted)]">
                Pas besoin d’arriver avec un cahier de charges parfait. Une idée, un objectif et quelques exemples suffisent pour commencer. Je peux ensuite vous aider à choisir le format le plus pertinent sans ajouter des morceaux inutiles au projet.
              </p>
              <ContactPrefillLink href="/contact" className="cta-primary mt-6 w-full justify-center px-7 py-3.5 sm:w-auto">
                Clarifier mon projet
              </ContactPrefillLink>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-4 md:pb-24">
        <div className="warm-cta-panel mx-auto max-w-4xl p-10 text-center md:p-14">
          <h2 className="font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">Une idée spéciale? Écrivez-moi.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[color:var(--site-muted)]">
            Les projets qui ne rentrent pas parfaitement dans une case sont souvent les plus intéressants. On peut bâtir une approche sur mesure, cohérente avec votre public, votre budget et l’émotion que vous voulez créer.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <ContactPrefillLink href="/contact" className="cta-primary w-full justify-center px-8 py-4 sm:w-auto">
              Parler de mon projet
            </ContactPrefillLink>
            <Link href="/creations" className="cta-secondary w-full justify-center px-8 py-4 sm:w-auto">
              Voir mes créations
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
