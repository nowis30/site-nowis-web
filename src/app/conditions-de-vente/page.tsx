import { PageHero } from '@/components/marketing/PageHero';
import { complianceNotes, conditionsContent, legalConfig, legalLinks } from '@/data/legal';
import { songPackages, videoExtraOptions } from '@/data/songSales';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Conditions de vente | Création Nowis',
  description:
    'Consultez les conditions de vente et de service de Création Nowis : informations sur l’entreprise, forfaits, paiements, révisions, remboursements et droits d’utilisation.',
  path: '/conditions-de-vente',
  keywords: ['conditions de vente Création Nowis', 'conditions de service chanson personnalisée', 'remboursement Création Nowis'],
});

function InfoValue({ value, fallback }: { value: string | null; fallback?: string }) {
  if (value) {
    return <span>{value}</span>;
  }

  return <span className="font-medium text-amber-700">{fallback || 'À compléter avant mise en ligne.'}</span>;
}

export default function ConditionsDeVentePage() {
  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Conditions de vente"
        title="Des conditions claires pour vendre les services de façon plus propre et plus compréhensible"
        description="Cette page explique les informations utiles avant de commander : services offerts, prix, paiements, délais, révisions, remboursement, annulation et droits d’utilisation."
        primaryCta={{ label: 'Commander une chanson', href: '/commander-une-chanson' }}
        secondaryCta={{ label: 'Politique de confidentialité', href: legalLinks.privacy }}
      />

      <section className="mx-auto max-w-5xl space-y-8 px-6 py-16 md:py-20">
        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">Conditions de vente et de service</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Ces conditions présentent le cadre général utilisé par Création Nowis pour les services vendus à distance. Elles visent à rendre l’offre plus lisible, sans remplacer une validation humaine du projet lorsque cela est nécessaire.
          </p>
          <p className="mt-4 text-sm text-slate-500">Dernière mise à jour : {legalConfig.legalLastUpdated}</p>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">1. Informations sur l’entreprise</h2>
          <dl className="mt-6 grid gap-4 text-sm leading-6 text-slate-700 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Nom commercial</dt>
              <dd className="mt-1">{legalConfig.companyName}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Nom légal</dt>
              <dd className="mt-1"><InfoValue value={legalConfig.legalName} fallback="À compléter si différent du nom commercial." /></dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">{legalConfig.businessIdLabel}</dt>
              <dd className="mt-1"><InfoValue value={legalConfig.businessIdValue} fallback="À compléter avant mise en ligne si applicable." /></dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Courriel</dt>
              <dd className="mt-1"><a href={`mailto:${legalConfig.contactEmail}`} className="text-emerald-700 hover:underline">{legalConfig.contactEmail}</a></dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="font-semibold text-slate-950">Téléphone</dt>
              <dd className="mt-1"><a href={legalConfig.contactPhoneHref} className="text-emerald-700 hover:underline">{legalConfig.contactPhone}</a></dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <dt className="font-semibold text-slate-950">Adresse postale</dt>
              <dd className="mt-1"><InfoValue value={legalConfig.companyAddress} fallback={legalConfig.companyAddressPlaceholder} /></dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">2. Services offerts</h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            {conditionsContent.services.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">3. Prix et paiements</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <ul className="space-y-3 text-slate-700">
                {conditionsContent.pricing.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Forfaits affichés</p>
              <div className="mt-4 space-y-4">
                {songPackages.map((pack) => (
                  <div key={pack.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-950">{pack.name}</p>
                      <p className="font-bold text-slate-950">{pack.price}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{pack.description}</p>
                  </div>
                ))}
                {videoExtraOptions.map((option) => (
                  <div key={option.name} className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-950">{option.name}</p>
                      <p className="font-bold text-slate-950">{option.price}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">4. Délais</h2>
          <p className="mt-4 leading-7 text-slate-700">{conditionsContent.delays}</p>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">5. Révisions</h2>
          <p className="mt-4 leading-7 text-slate-700">{conditionsContent.revisions}</p>
        </article>

        <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">6. Garantie satisfaction</h2>
          <p className="mt-4 leading-7 text-slate-700">{conditionsContent.guarantee}</p>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">7. Politique d’annulation et de remboursement</h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            {conditionsContent.cancellation.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">8. Droits d’utilisation et propriété intellectuelle</h2>
          <div className="mt-6 space-y-4 leading-7 text-slate-700">
            {conditionsContent.intellectualProperty.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">9. Vente à distance</h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            {conditionsContent.distanceSelling.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">10. Droit applicable</h2>
          <p className="mt-4 leading-7 text-slate-700">{conditionsContent.governingLaw}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{complianceNotes.legalReview}</p>
        </article>
      </section>
    </div>
  );
}
