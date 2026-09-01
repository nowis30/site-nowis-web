import Link from 'next/link';
import { TrackedPhoneLink } from '@/components/analytics/TrackedPhoneLink';
import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';
import { complianceNotes, essentialCookies, legalConfig, legalLinks } from '@/data/legal';

export const metadata = buildMetadata({
  title: 'Mentions légales | Création Nowis',
  description:
    'Consultez les mentions légales de Création Nowis : identité de l’exploitant, coordonnées, responsable vie privée, cookies essentiels et informations utiles avant mise en relation.',
  path: '/mentions-legales',
  keywords: ['mentions légales Création Nowis', 'informations entreprise Nowis', 'conformité site Québec'],
});

export default function MentionsLegalesPage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Mentions légales"
        title="Les informations publiques essentielles du site"
        description="Cette page regroupe les informations d’identification, les coordonnées de contact et les principaux éléments publics utiles à la transparence de Création Nowis."
        primaryCta={{ label: 'Politique de confidentialité', href: legalLinks.privacy }}
        secondaryCta={{ label: 'Conditions de vente', href: legalLinks.terms }}
      />

      <section className="mx-auto max-w-5xl space-y-6 px-6 py-14 md:space-y-8 md:py-20">
        <article className="warm-cta-panel p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">En bref</span>
          <h2 className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
            Mentions légales de Création Nowis
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Cette page présente les informations publiques d’identification de l’exploitant, les coordonnées de contact et les éléments de transparence utiles au public.
          </p>
          <p className="mt-5 text-sm font-medium text-[color:var(--site-soft)]">
            Dernière mise à jour : {legalConfig.legalLastUpdated}
          </p>
        </article>

        <article className="brand-card p-7 sm:p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            1. Exploitant du site
          </h2>
          <dl className="mt-6 grid gap-4 text-sm leading-7 text-[color:var(--site-muted)] md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">Nom commercial</dt>
              <dd className="mt-1">{legalConfig.companyName}</dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">Nom légal</dt>
              <dd className="mt-1">{legalConfig.legalName}</dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">{legalConfig.businessIdLabel}</dt>
              <dd className="mt-1">{legalConfig.businessIdValue}</dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">Région d’activité</dt>
              <dd className="mt-1">{legalConfig.companyRegion}</dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5 md:col-span-2">
              <dt className="font-semibold text-[color:var(--site-heading)]">Adresse postale</dt>
              <dd className="mt-1 whitespace-pre-line">{legalConfig.companyAddress}</dd>
            </div>
          </dl>
        </article>

        <article className="warm-spotlight-panel p-7 sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Contact officiel</p>
          <h2 className="mt-4 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            2. Coordonnées
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
            {legalConfig.responsiblePrivacyTitle} :{' '}
            <span className="font-semibold text-[color:var(--site-heading)]">{legalConfig.responsiblePrivacyName}</span>
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={`mailto:${legalConfig.contactEmail}`}
              className="cta-secondary inline-flex min-h-11 items-center justify-center px-4 py-3 text-center text-sm font-semibold"
            >
              {legalConfig.contactEmail}
            </a>
            <TrackedPhoneLink
              href={legalConfig.contactPhoneHref}
              className="cta-secondary inline-flex min-h-11 items-center justify-center px-4 py-3 text-center text-sm font-semibold"
            >
              {legalConfig.contactPhone}
            </TrackedPhoneLink>
          </div>
        </article>

        <article className="brand-card p-7 sm:p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            3. Cookies essentiels déclarés
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
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-sm leading-7 text-[color:var(--site-soft)]">
            <p>{complianceNotes.noMarketingCookies}</p>
            <p>{complianceNotes.cookieBannerRule}</p>
          </div>
        </article>

        <article className="warm-cta-panel p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">Transparence</span>
          <h2 className="mt-5 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            4. Note d’exploitation
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Le site est exploité par Simon Morin à titre de travailleur autonome. Aucun NEQ n’est affiché à ce jour.
          </p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--site-soft)]">{complianceNotes.legalReview}</p>
        </article>

        <article className="brand-card p-7 sm:p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            Consulter les autres informations utiles
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href={legalLinks.privacy}
              className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold"
            >
              Politique de confidentialité
            </Link>
            <Link
              href={legalLinks.terms}
              className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold"
            >
              Conditions de vente
            </Link>
            <Link
              href={legalLinks.contact}
              className="cta-primary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold"
            >
              Contacter Création Nowis
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
