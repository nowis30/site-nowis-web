import Link from 'next/link';
import { ExternalLink, PackageCheck, Palette, ShoppingBag, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Palette,
    title: 'Designs signés NOWIS',
    description: 'Des visuels issus de l’univers Création NOWIS, pensés pour rester simples, expressifs et faciles à porter.',
  },
  {
    icon: PackageCheck,
    title: 'Impression à la demande',
    description: 'Les produits sont fabriqués à la commande par Printify, ce qui évite de produire du stock inutilement.',
  },
  {
    icon: Sparkles,
    title: 'Boutique facile à parcourir',
    description: 'Le catalogue, les variantes, les prix et les options de livraison sont regroupés directement sur la boutique Printify.',
  },
];

export function ShopScreen() {
  return (
    <main className="site-background text-[color:var(--site-text)]">
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-10 md:pb-14 md:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <span className="brand-chip">Boutique NOWIS</span>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] text-[color:var(--site-heading)] md:text-6xl">
              Des créations NOWIS qui sortent de l’écran.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--site-muted)]">
              La boutique rassemble des produits imprimés à partir de visuels Création NOWIS. Le catalogue et la livraison sont gérés sur Printify afin de garder l’expérience simple et transparente.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://nowis.printify.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-primary w-full justify-center px-7 py-4 sm:w-auto"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                Ouvrir la boutique
                <ExternalLink size={16} aria-hidden="true" />
              </a>
              <Link href="/portfolio" className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto">
                Voir le portfolio
              </Link>
            </div>

            <p className="mt-4 text-sm leading-6 text-[color:var(--site-muted)]">
              Le bouton Boutique ouvre Printify dans un nouvel onglet.
            </p>
          </div>

          <aside className="warm-spotlight-panel p-7 md:p-9" aria-label="À propos de la boutique">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/80 text-3xl shadow-sm" aria-hidden="true">
              🛍️
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-primary-400">Création + impression</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
              Une vitrine plus propre, sans faux inventaire.
            </h2>
            <p className="mt-4 leading-7 text-[color:var(--site-muted)]">
              Les disponibilités, formats et délais affichés sur Printify sont la référence au moment de la commande. La page NOWIS sert de porte d’entrée claire vers cette boutique externe.
            </p>
          </aside>
        </div>
      </section>

      <section className="section-soft px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Ce que tu trouveras</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-[color:var(--site-heading)] md:text-5xl">
              Une boutique cohérente avec l’univers NOWIS.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="brand-card p-6 md:p-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-white/75 text-primary-400 shadow-sm">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-2xl text-[color:var(--site-heading)]">{title}</h3>
                <p className="mt-3 leading-7 text-[color:var(--site-muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="warm-cta-panel mx-auto max-w-4xl p-8 text-center md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary-400">Tu cherches plutôt du sur-mesure?</p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-[color:var(--site-heading)] md:text-5xl">
            Une création personnalisée peut partir d’une simple idée.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[color:var(--site-muted)]">
            Pour une chanson, une vidéo, un concept visuel ou un autre projet créatif, passe par les services NOWIS plutôt que par la boutique de produits imprimés.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/services" className="cta-primary w-full justify-center px-8 py-4 sm:w-auto">
              Découvrir les services
            </Link>
            <Link href="/contact" className="cta-secondary w-full justify-center px-8 py-4 sm:w-auto">
              Parler de mon idée
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
