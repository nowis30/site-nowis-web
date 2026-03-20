import Link from 'next/link';
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

function ValueOrWarning({ value, fallback }: { value: string | null; fallback: string }) {
  return value ? <span>{value}</span> : <span className="font-medium text-amber-700">{fallback}</span>;
}

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
            Ces informations améliorent la transparence du site public. Certaines données d’entreprise doivent encore être validées ou complétées lorsque cela s’applique.
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
              <dd className="mt-1"><ValueOrWarning value={legalConfig.legalName} fallback="À compléter avant mise en ligne si différent du nom commercial." /></dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">{legalConfig.businessIdLabel}</dt>
              <dd className="mt-1"><ValueOrWarning value={legalConfig.businessIdValue} fallback="À compléter si l’activité doit être identifiée publiquement." /></dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Région d’activité</dt>
              <dd className="mt-1">{legalConfig.companyRegion}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <dt className="font-semibold text-slate-950">Adresse postale</dt>
              <dd className="mt-1"><ValueOrWarning value={legalConfig.companyAddress} fallback={legalConfig.companyAddressPlaceholder} /></dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">2. Coordonnées</h2>
          <div className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
            <p>Courriel : <a href={`mailto:${legalConfig.contactEmail}`} className="font-medium text-emerald-700 hover:underline">{legalConfig.contactEmail}</a></p>
            <p>Téléphone : <a href={legalConfig.contactPhoneHref} className="font-medium text-emerald-700 hover:underline">{legalConfig.contactPhone}</a></p>
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

        <article className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">4. Points à compléter avant prétendre à une conformité complète</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
            <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">!</span><span>Renseigner le nom légal exact si différent de « Création Nowis ».</span></li>
            <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">!</span><span>Ajouter l’adresse postale réelle de l’exploitant.</span></li>
            <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">!</span><span>Ajouter le NEQ ou l’identifiant d’entreprise si applicable.</span></li>
            <li className="flex gap-3"><span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">!</span><span>Faire valider les textes par un juriste si le site est exploité commercialement de façon active.</span></li>
          </ul>
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