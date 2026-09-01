import Link from 'next/link';
import { ArrowRight, Headphones, Images, Sparkles, Video, WandSparkles } from 'lucide-react';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

const creationPaths = [
  {
    icon: Headphones,
    eyebrow: 'Écouter',
    title: 'Musique et chansons publiées',
    description: 'Entre dans la bibliothèque musicale pour écouter les chansons, extraits et créations audio déjà disponibles.',
    href: '/musique',
    cta: 'Écouter la musique',
  },
  {
    icon: Video,
    eyebrow: 'Regarder',
    title: 'Vidéos, clips et contenus IA',
    description: 'Découvre les vidéos publiées et la façon dont musique, narration et image peuvent être réunies dans un même projet.',
    href: '/videos',
    cta: 'Voir les vidéos',
  },
  {
    icon: Images,
    eyebrow: 'Explorer',
    title: 'Portfolio NOWIS',
    description: 'Parcours une vue structurée des créations, produits et projets pour voir rapidement les différents univers de Création NOWIS.',
    href: '/portfolio',
    cta: 'Ouvrir le portfolio',
  },
  {
    icon: WandSparkles,
    eyebrow: 'Créer',
    title: 'Projet sur mesure',
    description: 'Chanson personnalisée, vidéo IA, concept visuel ou projet hybride : pars de ton objectif et choisis ensuite la bonne formule.',
    href: '/services',
    cta: 'Explorer les services',
  },
];

export const metadata = buildMetadata({
  title: 'Créations de Création Nowis | Musique, vidéos IA et projets sur mesure',
  description:
    'Explorez les créations de Création Nowis : musique, vidéos IA, portfolio et projets sur mesure portés par Nowis Morin à Drummondville et au Québec.',
  path: '/creations',
  keywords: ['créations Création Nowis', 'vidéos IA Québec', 'musique Nowis Morin', 'portfolio NOWIS', 'projets créatifs Drummondville'],
});

export default function CreationsPage() {
  return (
    <main className="site-background text-[color:var(--site-text)]">
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-10 md:pb-14 md:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <span className="brand-chip">Créations NOWIS</span>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] text-[color:var(--site-heading)] md:text-6xl">
              Écouter, regarder, explorer ou créer.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
              Cette page est le point de départ rapide vers les créations de Nowis Morin et de Création NOWIS. Choisis ce que tu veux découvrir maintenant, sans fouiller dans plusieurs menus.
            </p>
          </div>

          <aside className="glass-panel-soft p-6 md:p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/80 text-secondary-400 shadow-sm">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">Une porte d’entrée simple</p>
                <p className="mt-2 leading-7 text-[color:var(--site-muted)]">
                  Le portfolio montre l’ensemble organisé. Ici, l’objectif est plus direct : trouver rapidement quoi écouter, regarder ou demander.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-soft px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Choisir un univers</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-[color:var(--site-heading)] md:text-5xl">
              Qu’est-ce que tu veux découvrir?
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-[color:var(--site-muted)]">
              Chaque carte mène vers une section active du site. Aucun cul-de-sac, aucune galerie vide : tu arrives directement au contenu ou à la prochaine action utile.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {creationPaths.map(({ icon: Icon, eyebrow, title, description, href, cta }) => (
              <article key={title} className="brand-card group flex h-full flex-col p-7 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/75 text-primary-400 shadow-sm">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="brand-chip">{eyebrow}</span>
                </div>
                <h3 className="mt-6 font-display text-3xl leading-tight text-[color:var(--site-heading)]">{title}</h3>
                <p className="mt-4 flex-1 leading-7 text-[color:var(--site-muted)]">{description}</p>
                <div className="mt-7">
                  <Link href={href} className="cta-secondary w-full justify-center px-5 py-3.5 text-sm sm:w-auto">
                    {cta}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="warm-cta-panel mx-auto max-w-5xl p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div>
              <span className="text-4xl" role="img" aria-hidden="true">✨</span>
              <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
                Tu veux créer quelque chose de nouveau?
              </h2>
            </div>
            <div>
              <p className="leading-8 text-[color:var(--site-muted)]">
                Pas besoin d’arriver avec un cahier des charges complet. Une idée, un moment à raconter ou un objectif suffit pour commencer et choisir ensuite le bon format.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={SONG_REQUEST_GOOGLE_AUTH_URL} className="cta-secondary w-full justify-center px-6 py-3.5 sm:w-auto">
                  Demander une chanson
                </Link>
                <Link href="/ateliers" className="cta-secondary w-full justify-center px-6 py-3.5 sm:w-auto">
                  Voir les ateliers
                </Link>
                <ContactPrefillLink href="/contact" className="cta-primary w-full justify-center px-6 py-3.5 sm:w-auto">
                  Parler de mon projet
                </ContactPrefillLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
