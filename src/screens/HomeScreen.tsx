import Link from 'next/link';
import { LAUNCH_DISCOUNT_PERCENT, LAUNCH_END_LABEL } from '@/data/pricing';

const offers = [
  {
    title: 'Ateliers de création musicale avec l\'IA',
    description:
      'Des ateliers participatifs animés en personne par Nowis Morin. Le groupe crée une chanson concrète ensemble.',
    href: '/ateliers',
  },
  {
    title: 'Chansons personnalisées',
    description:
      'Une chanson sur mesure à partir de votre histoire, de vos émotions et de votre intention.',
    href: '/commander-une-chanson',
  },
  {
    title: 'Vidéos et contenus créatifs',
    description:
      'Des contenus visuels et créatifs pour prolonger une chanson, un atelier ou un projet spécial.',
    href: '/autres-services',
  },
];

const audienceTags = ['Aînés', 'Écoles', 'Bibliothèques', 'Organismes', 'Maisons des jeunes', 'Groupes privés'];

// ─── Composant principal ──────────────────────────────────────────────────────

export const HomeScreen = async () => {
  return (
    <div className="relative overflow-hidden bg-transparent text-[color:var(--site-text)]">
      <section className="relative overflow-hidden px-6 pb-8 pt-12 md:pb-10 md:pt-16">
        <div className="mx-auto max-w-6xl">
          <span className="brand-chip inline-block">Création Nowis</span>
          <h1 className="brand-metal-text mt-5 max-w-4xl font-display text-5xl leading-[0.95] md:text-7xl">
            Créer une chanson, un atelier ou une vidéo avec l'IA - sans perdre l'humain.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            Création Nowis transforme vos idées, souvenirs et émotions en chansons, ateliers et contenus créatifs animés par Nowis Morin.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link href="/ateliers/demande" className="cta-primary w-full justify-center px-7 py-4 sm:w-auto">
              Demander un atelier
            </Link>
            <Link href="/commander-une-chanson" className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto">
              Créer une chanson personnalisée
            </Link>
            <Link href="/tarifs" className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-6xl rounded-[1.6rem] border border-[rgba(184,111,61,0.18)] bg-[linear-gradient(140deg,rgba(255,252,247,0.94),rgba(247,235,221,0.95))] px-5 py-5 shadow-[0_16px_36px_rgba(143,81,40,0.1)] md:flex md:items-center md:justify-between md:gap-6 md:px-7">
          <p className="text-sm font-semibold text-[color:var(--site-heading)] md:text-base">
            Offre de lancement : {LAUNCH_DISCOUNT_PERCENT} % de rabais jusqu'au {LAUNCH_END_LABEL}.
          </p>
          <Link href="/tarifs" className="cta-primary mt-4 w-full justify-center px-6 py-3 text-sm md:mt-0 md:w-auto">
            Voir les prix
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Ce que je fais</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {offers.map((offer) => (
            <article key={offer.title} className="brand-card flex flex-col p-7">
              <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{offer.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[color:var(--site-muted)]">{offer.description}</p>
              <Link href={offer.href} className="cta-secondary mt-5 px-5 py-3 text-sm">
                En savoir plus
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-soft px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Atelier de création musicale avec l'IA</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)]">
            Une activité humaine, simple et participative où le groupe crée une chanson avec l'aide de l'IA et repart avec un souvenir concret.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              'Accessible à tous les âges',
              'Aucune connaissance technique requise',
              'Chanson créée avec le groupe',
              'Vidéo ou dossier souvenir possible',
            ].map((point) => (
              <div key={point} className="glass-panel-soft rounded-xl px-4 py-3 text-sm text-[color:var(--site-heading)]">
                {point}
              </div>
            ))}
          </div>
          <Link href="/ateliers/demande" className="cta-primary mt-7 inline-flex px-7 py-3.5">
            Demander cet atelier
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <h2 className="font-display text-4xl text-[color:var(--site-heading)] md:text-5xl">Pour qui</h2>
        <div className="mt-7 flex flex-wrap gap-3">
          {audienceTags.map((tag) => (
            <span key={tag} className="rounded-full border border-[rgba(131,97,67,0.2)] bg-white/75 px-4 py-2 text-sm font-semibold text-[color:var(--site-heading)]">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 pt-8 md:pb-20 md:pt-10">
        <div className="warm-cta-panel mx-auto max-w-4xl p-10 text-center md:p-14">
          <h2 className="font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Vous avez une idée de chanson, d'atelier ou de projet créatif ?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Écrivez-moi votre idée. Je vous aide à la transformer en projet concret.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact" className="cta-primary w-full justify-center px-8 py-4 sm:w-auto">
              Me contacter
            </Link>
            <Link href="/tarifs" className="cta-secondary w-full justify-center px-8 py-4 sm:w-auto">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
