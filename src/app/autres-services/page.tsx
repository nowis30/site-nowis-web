import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { formatPrice, REGULAR_PRICES } from '@/data/pricing';

const hourlyRegularPrice = REGULAR_PRICES.hourly;

export const metadata = buildMetadata({
  title: 'Expertises complémentaires — Création Nowis | Jeux IA, accompagnement et projets spéciaux',
  description:
    'Découvrez les expertises complémentaires de Création Nowis : jeux interactifs, accompagnement artistique, expériences IA et projets spéciaux à Drummondville et partout au Québec.',
  path: '/autres-services',
  keywords: ['expertises Création Nowis', 'jeux IA Québec', 'accompagnement artistes Drummondville', 'projets créatifs IA'],
});

const complementaryServices = [
  {
    icon: '🎮',
    eyebrow: 'Jeux et interactions',
    title: 'Expériences interactives avec l’IA',
    description:
      'Conception d’expériences ludiques, éducatives ou événementielles qui utilisent l’IA comme outil de création plutôt que comme gadget.',
    items: [
      'Jeux de création musicale interactive',
      'Expériences éducatives autour de l’IA',
      'Animations participatives pour événements',
    ],
  },
  {
    icon: '🎤',
    eyebrow: 'Accompagnement artistique',
    title: 'Direction créative pour artistes',
    description:
      'Accompagnement humain pour explorer l’IA sans perdre votre identité : idées, direction artistique, cohérence et développement de projets.',
    items: [
      'Exploration de nouveaux outils créatifs',
      'Direction et cohérence artistique',
      'Co-création et développement de concepts',
    ],
  },
  {
    icon: '🧩',
    eyebrow: 'Projets atypiques',
    title: 'Mandats qui ne rentrent pas dans une case',
    description:
      'Pour les projets hybrides qui mélangent musique, vidéo, jeu, contenu, événement ou expérimentation numérique dans un même mandat.',
    items: [
      'Concepts originaux et hybrides',
      'Collaborations avec organismes ou entreprises',
      'Projets ponctuels et prototypes créatifs',
    ],
  },
];

export default function AutresServicesPage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 12% 10%, rgba(184,111,61,0.12), transparent 26%),' +
              'radial-gradient(circle at 85% 8%, rgba(203,165,120,0.16), transparent 22%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <span className="brand-chip inline-block">Expertises complémentaires</span>
          <h1 className="brand-metal-text mt-5 max-w-4xl font-display text-5xl leading-[0.95] md:text-7xl">
            Pour les projets créatifs qui vont plus loin que l’offre classique
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            Cette page regroupe les mandats plus atypiques : jeux interactifs, accompagnement artistique et projets hybrides. Pour les chansons, vidéos, visuels et concepts créatifs plus standards, le hub Services reste la meilleure porte d’entrée.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link href="/contact" className="cta-primary min-h-11 w-full justify-center px-7 py-4 sm:w-auto">
              Discuter d’un projet spécial
            </Link>
            <Link href="/services" className="cta-secondary min-h-11 w-full justify-center px-7 py-4 sm:w-auto">
              Voir les services principaux
            </Link>
          </div>
        </div>
      </section>

      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ce que je peux aussi bâtir avec vous</p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
                Trois types de mandats vraiment complémentaires
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
              L’objectif est de garder les choses simples : une page pour les services réguliers, et ici uniquement les projets qui demandent une approche plus expérimentale ou sur mesure.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {complementaryServices.map((service) => (
              <article key={service.title} className="brand-card flex h-full flex-col p-7 md:p-8">
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/70 text-2xl shadow-sm"
                  role="img"
                  aria-hidden="true"
                >
                  {service.icon}
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary-400">{service.eyebrow}</p>
                <h3 className="mt-3 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">{service.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">{service.description}</p>
                <ul className="mt-6 space-y-3">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[color:var(--site-muted)]">
                      <span
                        className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-[10px] font-black text-primary-400"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 md:py-20">
        <div className="warm-spotlight-panel p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <span className="text-4xl" role="img" aria-hidden="true">🧭</span>
              <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
                Vous ne savez pas dans quelle catégorie votre idée entre?
              </h2>
            </div>
            <div>
              <p className="leading-8 text-[color:var(--site-muted)]">
                Aucun problème. Les mandats d’accompagnement suivent un tarif horaire régulier de {formatPrice(hourlyRegularPrice, ' / h')}. Les productions spéciales sont plutôt établies sur soumission, selon les livrables, la complexité et le contexte.
              </p>
              <Link href="/contact" className="cta-primary mt-6 min-h-11 w-full justify-center px-7 py-3.5 sm:w-auto">
                Clarifier mon projet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-warm px-6 py-14 md:py-18">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          <div className="glass-panel-strong p-7">
            <span className="text-3xl" role="img" aria-hidden="true">🎵</span>
            <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)] md:text-3xl">Vous cherchez une offre plus simple?</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              Chanson personnalisée, vidéo IA, visuel ou concept créatif : ces offres sont maintenant regroupées clairement dans le hub Services.
            </p>
            <Link href="/services" className="cta-secondary mt-5 min-h-11 w-full justify-center px-6 py-3 text-sm sm:w-auto">
              Aller aux services
            </Link>
          </div>

          <div className="warm-spotlight-panel p-7">
            <span className="text-3xl" role="img" aria-hidden="true">✨</span>
            <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)] md:text-3xl">Vous voulez voir ce que je crée?</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              Musique, vidéos, projets et créations visuelles sont regroupés dans l’espace Créations et le Portfolio.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/creations" className="cta-secondary min-h-11 w-full justify-center px-6 py-3 text-sm sm:w-auto">
                Voir les créations
              </Link>
              <Link href="/portfolio" className="cta-secondary min-h-11 w-full justify-center px-6 py-3 text-sm sm:w-auto">
                Explorer le portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        <div className="warm-cta-panel mx-auto max-w-4xl p-10 text-center md:p-16">
          <h2 className="font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Votre projet est un peu étrange? C’est probablement ici qu’il faut commencer.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Si votre idée mélange plusieurs formats ou ne ressemble à rien de standard, décrivez-la simplement. On pourra ensuite choisir une approche claire sans lui ajouter des morceaux inutiles.
          </p>
          <Link href="/contact" className="cta-primary mt-8 min-h-11 w-full justify-center px-9 py-4 sm:w-auto">
            Parler de mon projet
          </Link>
        </div>
      </section>
    </main>
  );
}
