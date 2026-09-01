import Link from 'next/link';
import { TrackedPhoneLink } from '@/components/analytics/TrackedPhoneLink';
import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';
import { complianceNotes, essentialCookies, legalConfig, legalLinks } from '@/data/legal';

export const metadata = buildMetadata({
  title: 'Politique de confidentialité | Création Nowis',
  description:
    'Consultez la politique de confidentialité de Création Nowis : renseignements recueillis, usage, conservation, droits d’accès et coordonnées du responsable de la protection des renseignements personnels.',
  path: '/confidentialite',
  keywords: ['politique de confidentialité Création Nowis', 'protection renseignements personnels Québec', 'confidentialité Nowis'],
});

const privacySections = [
  {
    title: '1. Introduction',
    content: [
      'Création Nowis prend au sérieux la protection des renseignements personnels fournis par ses visiteurs et ses clients.',
      'Cette politique explique, en termes simples, quels renseignements peuvent être recueillis, pourquoi ils le sont, comment ils sont utilisés et comment communiquer avec la personne responsable.',
    ],
  },
  {
    title: '2. Renseignements que nous pouvons recueillir',
    bullets: [
      'votre nom, votre courriel et votre numéro de téléphone lorsque vous remplissez un formulaire ou communiquez avec nous ;',
      'les renseignements que vous choisissez de partager au sujet de votre projet, de votre histoire ou de vos attentes ;',
      'certaines données techniques limitées liées à l’utilisation du site, comme l’adresse IP, les journaux techniques ou les données nécessaires au bon fonctionnement du service.',
    ],
  },
  {
    title: '3. Pourquoi ces renseignements sont recueillis',
    bullets: [
      'répondre à votre demande ;',
      'communiquer avec vous et assurer le suivi du projet ;',
      'préparer une proposition ou une direction de création adaptée ;',
      'respecter les obligations administratives, contractuelles ou légales applicables.',
    ],
  },
  {
    title: '4. Partage et accès aux renseignements',
    content: [
      'Les renseignements ne sont pas vendus. Ils peuvent être accessibles uniquement aux personnes autorisées ou à certains fournisseurs techniques nécessaires au fonctionnement du site, de l’hébergement ou des communications.',
      'Lorsque des outils externes sont utilisés, l’accès est limité à ce qui est raisonnablement nécessaire pour traiter la demande ou faire fonctionner le service.',
    ],
  },
  {
    title: '5. Conservation et sécurité',
    content: [
      'Les renseignements sont conservés pour la durée raisonnablement nécessaire au suivi des demandes, à la prestation des services et au respect des obligations applicables.',
      'Création Nowis met en place des mesures techniques et organisationnelles raisonnables pour limiter les accès non autorisés, la perte ou l’usage inapproprié des renseignements.',
    ],
  },
  {
    title: '6. Vos droits',
    bullets: [
      'demander l’accès à vos renseignements ;',
      'demander la correction d’un renseignement inexact ;',
      'demander le retrait ou la suppression de renseignements lorsque la situation le permet ;',
      'retirer votre consentement à certaines utilisations, sous réserve des obligations déjà en cours ou des exigences légales applicables.',
    ],
  },
  {
    title: '7. Cookies et outils similaires',
    content: [
      'Le site utilise surtout des mécanismes techniques nécessaires à son bon fonctionnement, à la sécurité ou à la gestion d’une session authentifiée lorsque certaines zones privées sont utilisées.',
      complianceNotes.noMarketingCookies,
      complianceNotes.cookieBannerRule,
      'Vous pouvez limiter certains cookies dans votre navigateur, mais certaines fonctions du site pourraient alors être affectées.',
    ],
  },
  {
    title: '8. Mise à jour de la politique',
    content: [
      'Cette politique peut être ajustée si les pratiques du site évoluent ou si des clarifications deviennent nécessaires. La version la plus récente reste publiée sur cette page.',
    ],
  },
];

function SectionBlock({ title, content, bullets }: { title: string; content?: string[]; bullets?: string[] }) {
  return (
    <section className="brand-card p-7 sm:p-8 md:p-10">
      <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">{title}</h2>
      {content?.length ? (
        <div className="mt-5 space-y-4 text-base leading-8 text-[color:var(--site-muted)]">
          {content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {bullets?.length ? (
        <ul className="mt-6 space-y-4 text-base leading-7 text-[color:var(--site-muted)]">
          {bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--site-heading)] text-xs font-bold text-white"
              >
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Protection des renseignements personnels"
        title="Une politique de confidentialité claire, lisible et accessible"
        description="Cette page explique comment Création Nowis recueille, utilise, conserve et traite les renseignements personnels transmis par le site public."
        primaryCta={{ label: 'Conditions de vente', href: legalLinks.terms }}
        secondaryCta={{ label: 'Contacter Création Nowis', href: legalLinks.contact }}
      />

      <section className="mx-auto max-w-5xl space-y-6 px-6 py-14 md:space-y-8 md:py-20">
        <article className="warm-cta-panel p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">En bref</span>
          <h2 className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
            Politique de confidentialité
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Cette politique vise à mieux expliquer les pratiques de Création Nowis en matière de protection des renseignements personnels, sans donner un faux sentiment de sécurité ni faire de promesse absolue.
          </p>
          <p className="mt-5 text-sm font-medium text-[color:var(--site-soft)]">
            Dernière mise à jour : {legalConfig.legalLastUpdated}
          </p>
        </article>

        <article className="warm-spotlight-panel p-7 sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            {legalConfig.responsiblePrivacyTitle}
          </p>
          <h2 className="mt-4 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            Coordonnées du responsable
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Le responsable de la protection des renseignements personnels de {legalConfig.companyName} est :
          </p>
          <div className="mt-6 rounded-2xl border border-black/10 bg-white/75 p-5 text-sm leading-7 text-[color:var(--site-muted)] sm:p-6">
            <p className="font-semibold text-[color:var(--site-heading)]">{legalConfig.responsiblePrivacyName}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${legalConfig.privacyEmail}`}
                className="cta-secondary inline-flex min-h-11 items-center justify-center px-4 py-3 text-center text-sm font-semibold"
              >
                {legalConfig.privacyEmail}
              </a>
              <TrackedPhoneLink
                href={legalConfig.privacyPhoneHref}
                className="cta-secondary inline-flex min-h-11 items-center justify-center px-4 py-3 text-center text-sm font-semibold"
              >
                {legalConfig.privacyPhone}
              </TrackedPhoneLink>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-[color:var(--site-muted)]">
            Pour toute question concernant la collecte, l’utilisation, la conservation ou la suppression de vos renseignements personnels, vous pouvez communiquer avec cette personne.
          </p>
        </article>

        {privacySections.map((section) => (
          <SectionBlock key={section.title} title={section.title} content={section.content} bullets={section.bullets} />
        ))}

        <article className="brand-card p-7 sm:p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            Cookies essentiels actuellement déclarés
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {essentialCookies.map((cookie) => (
              <div
                key={cookie.name}
                className="rounded-2xl border border-black/10 bg-white/70 p-5 text-sm leading-7 text-[color:var(--site-muted)]"
              >
                <p className="font-semibold text-[color:var(--site-heading)]">{cookie.name}</p>
                <p className="mt-2">Finalité : {cookie.purpose}</p>
                <p>Durée maximale : {cookie.duration}</p>
                <p>Essentiel : {cookie.required ? 'oui' : 'non'}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-[color:var(--site-soft)]">{complianceNotes.legalReview}</p>
        </article>

        <article className="warm-cta-panel p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">Navigation légale</span>
          <h2 className="mt-5 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            Consulter les autres informations utiles
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href={legalLinks.legal} className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold">
              Mentions légales
            </Link>
            <Link href={legalLinks.terms} className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold">
              Conditions de vente
            </Link>
            <Link href={legalLinks.contact} className="cta-primary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold">
              Contacter Création Nowis
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
