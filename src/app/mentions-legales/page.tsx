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
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Mentions légales"
        title="Les informations publiques essentielles du site"
        description="Cette page regroupe les informations d’identification, les coordonnées de contact et les principaux éléments publics utiles à la conformité d’un site commercial." 
        primaryCta={{ label: 'Politique de confidentialité', href: legalLinks.privacy }}
        secondaryCta={{ label: 'Conditions de vente', href: legalLinks.terms }}
      />

      <section className="mx-auto max-w-5xl space-y-8 px-6 py-16 md:py-20">
        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">Mentions légales</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Cette page présente les informations publiques d’identification de l’exploitant, les coordonnées de contact et les éléments de transparence utiles au public.
          </p>
          <p className="mt-4 text-sm text-slate-500">Dernière mise à jour : {legalConfig.legalLastUpdated}</p>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">1. Exploitant du site</h2>
          <dl className="mt-6 grid gap-4 text-sm leading-6 text-slate-700 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Nom commercial</dt>
              <dd className="mt-1">{legalConfig.companyName}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Nom légal</dt>
              <dd className="mt-1">{legalConfig.legalName}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">{legalConfig.businessIdLabel}</dt>
              <dd className="mt-1">{legalConfig.businessIdValue}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Région d’activité</dt>
              <dd className="mt-1">{legalConfig.companyRegion}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <dt className="font-semibold text-slate-950">Adresse postale</dt>
              <dd className="mt-1 whitespace-pre-line">{legalConfig.companyAddress}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">2. Coordonnées</h2>
          <div className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
            <p>Courriel : <a href={`mailto:${legalConfig.contactEmail}`} className="font-medium text-emerald-700 hover:underline">{legalConfig.contactEmail}</a></p>
            <p>Téléphone : <TrackedPhoneLink href={legalConfig.contactPhoneHref} className="font-medium text-emerald-700 hover:underline">{legalConfig.contactPhone}</TrackedPhoneLink></p>
            <p>{legalConfig.responsiblePrivacyTitle} : {legalConfig.responsiblePrivacyName}</p>
          </div>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">3. Cookies essentiels déclarés</h2>
          <div className="mt-6 space-y-4">
            {essentialCookies.map((cookie) => (
              <div key={cookie.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-slate-950">{cookie.name}</p>
                <p className="mt-2">Finalité : {cookie.purpose}</p>
                <p>Durée maximale : {cookie.duration}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{complianceNotes.noMarketingCookies}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{complianceNotes.cookieBannerRule}</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-100 p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">4. Note d’exploitation</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Le site est exploité par Simon Morin à titre de travailleur autonome. Aucun NEQ n’est affiché à ce jour.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{complianceNotes.legalReview}</p>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">Liens utiles</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href={legalLinks.privacy} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Politique de confidentialité
            </Link>
            <Link href={legalLinks.terms} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Conditions de vente
            </Link>
            <Link href={legalLinks.contact} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Contact
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}