import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Avant de m’écrire — Nowis Morin',
  description:
    'Prépare mieux ta demande avant de contacter Nowis Morin : ce que je peux créer, les informations utiles et comment formuler une demande claire.',
  path: '/avant-de-mecrire',
  keywords: ['avant de m’écrire', 'préparer sa demande créative', 'Nowis Morin contact', 'demande claire projet créatif'],
});

const canCreate = [
  'Chansons personnalisées à partir d’une histoire ou d’une émotion.',
  'Vidéos créatives, teasers, pubs courtes et formats réseaux sociaux.',
  'Visuels promotionnels, concepts créatifs et identités cohérentes.',
  'Pages web, idées interactives, concepts de jeux et vitrines de projet.',
];

const cannotCreate = [
  'Un projet flou sans intention, contexte ni objectif minimal.',
  'Des demandes contraires à l’image ou aux valeurs de la marque.',
  'Un résultat sérieux en quelques minutes sans matière de départ.',
  'Des projets qui demandent une expertise technique hors du cadre présenté sur le site.',
];

const shouldPrepare = [
  'Ton objectif principal : émouvoir, vendre, divertir ou présenter.',
  'Le public visé : personne, famille, entreprise ou projet spécial.',
  'Le ton ou l’ambiance recherchée.',
  'Les détails essentiels à inclure et ce qu’il faut éviter.',
  'Ton délai idéal, même approximatif.',
];

const exampleRequests = [
  'Je veux une chanson pour l’anniversaire de ma conjointe. Je veux quelque chose de doux, vrai et personnel avec nos souvenirs de voyage.',
  'Je veux une vidéo courte pour présenter mon entreprise sur Facebook et Instagram. L’objectif est de donner confiance rapidement.',
  'Je veux un visuel fort pour annoncer un nouveau projet. J’ai besoin d’un style moderne, humain et marquant.',
  'Je veux une page ou un concept interactif pour expliquer un projet plus clairement à mes visiteurs.',
];

const projectContactHref = `/contact?message=${encodeURIComponent(
  'Je veux te parler de mon projet. Voici les détails que j’ai préparés.',
)}`;

export default function AvantDeMecrirePage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Préparer sa demande"
        title="Avant de m’écrire"
        description="Quelques repères simples pour mieux préparer ta demande, gagner du temps et partir dans la bonne direction dès le premier échange."
        primaryCta={{ label: 'Voir les services', href: '/services' }}
        secondaryCta={{ label: 'Me contacter', href: '/contact' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="brand-card p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Ce qui fonctionne bien</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
              Ce que je peux créer
            </h2>
            <ul className="mt-6 space-y-3">
              {canCreate.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 rounded-2xl border border-[color:var(--site-accent)]/10 bg-white/70 p-4 text-[color:var(--site-text)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--site-accent)] text-sm font-bold text-white"
                  >
                    ✓
                  </span>
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="warm-spotlight-panel p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">À cadrer avant de commencer</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
              Ce que je ne peux pas promettre
            </h2>
            <ul className="mt-6 space-y-3">
              {cannotCreate.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 rounded-2xl border border-[color:var(--site-accent)]/10 bg-white/70 p-4 text-[color:var(--site-text)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] text-sm font-bold text-[color:var(--site-heading)]"
                  >
                    —
                  </span>
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section-soft px-6 py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <article className="warm-cta-panel p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-400">Avant le premier message</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)]">
              Cinq informations suffisent pour bien partir
            </h2>
            <ul className="mt-6 space-y-3">
              {shouldPrepare.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 rounded-2xl border border-[color:var(--site-accent)]/10 bg-white/70 p-4 text-[color:var(--site-text)]"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--site-heading)] text-xs font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <span className="leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="brand-card p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-400">Exemples</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[color:var(--site-heading)]">
              Des demandes claires, sans devoir écrire un roman
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--site-muted)]">
              Quelques phrases précises donnent déjà assez de contexte pour comprendre l’intention, le format et le résultat recherché.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {exampleRequests.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[color:var(--site-accent)]/10 bg-white/70 p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-400">Exemple {index + 1}</p>
                  <p className="mt-3 leading-7 text-[color:var(--site-muted)]">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 md:py-20">
        <div className="warm-spotlight-panel p-8 text-center sm:p-10 md:p-12">
          <span className="brand-chip inline-flex">Prêt à commencer ?</span>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
            Explique-moi ton projet avec ce que tu as déjà
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Pas besoin que tout soit décidé. Avec quelques repères, je peux te répondre clairement et t’orienter vers le bon service ou la bonne approche.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <ContactPrefillLink href={projectContactHref} className="cta-primary w-full px-7 py-4 sm:w-auto">
              Me parler de mon projet
            </ContactPrefillLink>
            <Link href="/creations" className="cta-secondary w-full px-7 py-4 sm:w-auto">
              Voir des créations
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
