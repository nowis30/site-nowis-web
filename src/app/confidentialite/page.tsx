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
    <section className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
      <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
      {content?.length ? (
        <div className="mt-4 space-y-4 leading-7 text-slate-700">
          {content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {bullets?.length ? (
        <ul className="mt-5 space-y-3 leading-7 text-slate-700">
          {bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">•</span>
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
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Protection des renseignements personnels"
        title="Une politique de confidentialité rédigée de façon plus claire et plus lisible"
        description="Cette page explique comment Création Nowis recueille, utilise, conserve et traite les renseignements personnels transmis par le site public."
        primaryCta={{ label: 'Conditions de vente', href: legalLinks.terms }}
        secondaryCta={{ label: 'Contacter Création Nowis', href: legalLinks.contact }}
      />

      <section className="mx-auto max-w-5xl space-y-8 px-6 py-16 md:py-20">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">Politique de confidentialité</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Cette politique vise à mieux expliquer les pratiques de Création Nowis en matière de protection des renseignements personnels, sans donner un faux sentiment de sécurité ni faire de promesse absolue.
          </p>
          <p className="mt-4 text-sm text-slate-500">Dernière mise à jour : {legalConfig.legalLastUpdated}</p>
        </article>

        <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{legalConfig.responsiblePrivacyTitle}</p>
          <h2 className="mt-4 text-2xl font-bold text-slate-950">Coordonnées du responsable</h2>
          <p className="mt-4 leading-7 text-slate-700">
            Le responsable de la protection des renseignements personnels de {legalConfig.companyName} est :
          </p>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5 text-sm leading-7 text-slate-700">
            <p className="font-semibold text-slate-950">{legalConfig.responsiblePrivacyName}</p>
            <p>
              Courriel :{' '}
              <a href={`mailto:${legalConfig.privacyEmail}`} className="font-medium text-emerald-700 hover:underline">
                {legalConfig.privacyEmail}
              </a>
            </p>
            <p>
              Téléphone :{' '}
              <TrackedPhoneLink href={legalConfig.privacyPhoneHref} className="font-medium text-emerald-700 hover:underline">
                {legalConfig.privacyPhone}
              </TrackedPhoneLink>
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Pour toute question concernant la collecte, l’utilisation, la conservation ou la suppression de vos renseignements personnels, vous pouvez communiquer avec cette personne.
          </p>
        </article>

        {privacySections.map((section) => (
          <SectionBlock key={section.title} title={section.title} content={section.content} bullets={section.bullets} />
        ))}

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">Cookies essentiels actuellement déclarés</h2>
          <div className="mt-6 space-y-4">
            {essentialCookies.map((cookie) => (
              <div key={cookie.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-950">{cookie.name}</p>
                <p className="mt-2">Finalité : {cookie.purpose}</p>
                <p>Durée maximale : {cookie.duration}</p>
                <p>Essentiel : {cookie.required ? 'oui' : 'non'}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{complianceNotes.legalReview}</p>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">Liens utiles</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href={legalLinks.legal} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Voir les mentions légales
            </Link>
            <Link href={legalLinks.terms} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Voir les conditions de vente
            </Link>
            <Link href={legalLinks.contact} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Contacter Création Nowis
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
