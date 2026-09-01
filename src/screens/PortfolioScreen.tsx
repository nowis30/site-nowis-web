import Link from 'next/link';
import { ArrowRight, Headphones, Images, ShoppingBag, Sparkles, Video } from 'lucide-react';

const portfolioSections = [
  {
    icon: Headphones,
    eyebrow: 'Musique',
    title: 'Chansons et créations audio',
    description: 'Écoute des exemples publiés pour découvrir les ambiances, les émotions et la direction musicale des créations NOWIS.',
    href: '/musique',
    cta: 'Écouter les chansons',
  },
  {
    icon: Video,
    eyebrow: 'Vidéo',
    title: 'Clips et contenus visuels',
    description: 'Parcours les vidéos disponibles et vois comment musique, image et narration peuvent être assemblées dans une même expérience.',
    href: '/videos',
    cta: 'Voir les vidéos',
  },
  {
    icon: ShoppingBag,
    eyebrow: 'Produits',
    title: 'Boutique Création NOWIS',
    description: 'Découvre les créations imprimées et les produits disponibles à la commande par l’intermédiaire de la boutique Printify.',
    href: '/shop',
    cta: 'Ouvrir la boutique',
  },
  {
    icon: Images,
    eyebrow: 'Sur mesure',
    title: 'Projets créatifs et collaborations',
    description: 'Chanson personnalisée, vidéo IA, visuel ou concept : les projets spéciaux commencent par une discussion claire sur le besoin.',
    href: '/services',
    cta: 'Explorer les services',
  },
];

export function PortfolioScreen() {
  return (
    <main className="site-background text-[color:var(--site-text)]">
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-10 md:pb-14 md:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <span className="brand-chip">Portfolio NOWIS</span>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] text-[color:var(--site-heading)] md:text-6xl">
              Des créations à écouter, regarder et explorer.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
              Le portfolio réunit maintenant les pages actives de Création NOWIS au même endroit. Plus de galerie vide : chaque carte mène vers du contenu, une boutique ou un service réellement accessible.
            </p>
          </div>

          <aside className="glass-panel-soft p-6 md:p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/80 text-secondary-400 shadow-sm">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">Même univers, plusieurs formats</p>
                <p className="mt-2 leading-7 text-[color:var(--site-muted)]">
                  Musique, vidéo, produits et projets personnalisés gardent une identité commune sans être forcés dans la même présentation.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-soft px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Explorer les créations</p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-[color:var(--site-heading)] md:text-5xl">
                Choisis le format qui t’intéresse.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--site-muted)] md:text-right">
              Chaque destination conserve son propre contenu et son propre rythme, mais le parcours reste cohérent avec le reste du site NOWIS.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {portfolioSections.map(({ icon: Icon, eyebrow, title, description, href, cta }) => (
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
        <div className="warm-spotlight-panel mx-auto max-w-5xl p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div>
              <span className="text-4xl" role="img" aria-hidden="true">✨</span>
              <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
                Tu as une idée qui n’entre dans aucune case?
              </h2>
            </div>
            <div>
              <p className="leading-8 text-[color:var(--site-muted)]">
                Le portfolio montre ce qui existe déjà. Pour bâtir quelque chose de nouveau, le plus simple est de partir de ton objectif, de ton public et de l’émotion que tu veux créer.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/contact" className="cta-primary w-full justify-center px-7 py-3.5 sm:w-auto">
                  Parler de mon projet
                </Link>
                <Link href="/services" className="cta-secondary w-full justify-center px-7 py-3.5 sm:w-auto">
                  Voir les services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
