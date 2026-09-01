import Link from 'next/link';
import { TrackedPhoneLink } from '@/components/analytics/TrackedPhoneLink';
import { PageHero } from '@/components/marketing/PageHero';
import { complianceNotes, conditionsContent, legalConfig, legalLinks } from '@/data/legal';
import { songPackages, videoExtraOptions } from '@/data/songSales';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

export const metadata = buildMetadata({
  title: 'Conditions de vente | Création Nowis',
  description:
    'Consultez les conditions de vente et de service de Création Nowis : informations sur l’entreprise, validation des projets, paiements, révisions, remboursements et droits d’utilisation.',
  path: '/conditions-de-vente',
  keywords: ['conditions de vente Création Nowis', 'conditions de service chanson personnalisée', 'remboursement Création Nowis'],
});

function InfoValue({ value, fallback }: { value: string | null; fallback?: string }) {
  if (value) {
    return <span>{value}</span>;
  }

  return <span className="font-semibold text-amber-800">{fallback || 'À compléter avant mise en ligne.'}</span>;
}

function BulletList({ items, accent = false }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="space-y-4 text-base leading-7 text-[color:var(--site-muted)]">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              accent ? 'bg-emerald-700' : 'bg-[color:var(--site-heading)]'
            }`}
          >
            {accent ? '✓' : '•'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="brand-card p-7 sm:p-8 md:p-10">
      <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </article>
  );
}

export default function ConditionsDeVentePage() {
  return (
    <main className="text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Conditions de vente"
        title="Des conditions claires avant de démarrer un projet"
        description="Cette page explique les services offerts, la validation du projet, le paiement, les délais, les révisions, les remboursements et les droits d’utilisation applicables aux commandes Création Nowis."
        primaryCta={{ label: 'Commander une chanson', href: SONG_REQUEST_GOOGLE_AUTH_URL }}
        secondaryCta={{ label: 'Politique de confidentialité', href: legalLinks.privacy }}
      />

      <section className="mx-auto max-w-5xl space-y-6 px-6 py-14 md:space-y-8 md:py-20">
        <article className="warm-cta-panel p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">Avant de commander</span>
          <h2 className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
            Conditions de vente et de service
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Ces conditions présentent le cadre général utilisé par Création Nowis pour les services vendus à distance. Elles rendent l’offre plus lisible sans remplacer une validation humaine du projet lorsque cela est nécessaire.
          </p>
          <p className="mt-5 text-sm font-medium text-[color:var(--site-soft)]">
            Dernière mise à jour : {legalConfig.legalLastUpdated}
          </p>
        </article>

        <LegalSection title="1. Informations sur l’entreprise">
          <dl className="grid gap-4 text-sm leading-7 text-[color:var(--site-muted)] md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">Nom commercial</dt>
              <dd className="mt-1">{legalConfig.companyName}</dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">Nom légal</dt>
              <dd className="mt-1">
                <InfoValue value={legalConfig.legalName} fallback="À compléter si différent du nom commercial." />
              </dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">{legalConfig.businessIdLabel}</dt>
              <dd className="mt-1">
                <InfoValue value={legalConfig.businessIdValue} fallback="À compléter avant mise en ligne si applicable." />
              </dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
              <dt className="font-semibold text-[color:var(--site-heading)]">Région d’activité</dt>
              <dd className="mt-1">{legalConfig.companyRegion}</dd>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 p-5 md:col-span-2">
              <dt className="font-semibold text-[color:var(--site-heading)]">Adresse postale</dt>
              <dd className="mt-1 whitespace-pre-line">
                <InfoValue value={legalConfig.companyAddress} fallback={legalConfig.companyAddressPlaceholder} />
              </dd>
            </div>
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
        </LegalSection>

        <LegalSection title="2. Services offerts">
          <BulletList items={conditionsContent.services} />
        </LegalSection>

        <article className="warm-spotlight-panel p-7 sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Cadre commercial</p>
          <h2 className="mt-4 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            3. Validation du projet et paiement
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <BulletList items={conditionsContent.pricing} accent />
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/75 p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Exemples d’accompagnement</p>
              <div className="mt-4 space-y-4">
                {songPackages.map((pack) => (
                  <div key={pack.name} className="rounded-2xl border border-black/10 bg-white/75 p-4">
                    <p className="font-semibold text-[color:var(--site-heading)]">{pack.name}</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--site-soft)]">{pack.note}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">{pack.description}</p>
                  </div>
                ))}
                {videoExtraOptions.map((option) => (
                  <div key={option.name} className="rounded-2xl border border-dashed border-black/15 bg-white/65 p-4">
                    <p className="font-semibold text-[color:var(--site-heading)]">{option.name}</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--site-soft)]">{option.note}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <LegalSection title="4. Délais">
          <p className="text-base leading-8 text-[color:var(--site-muted)]">{conditionsContent.delays}</p>
        </LegalSection>

        <LegalSection title="5. Révisions">
          <p className="text-base leading-8 text-[color:var(--site-muted)]">{conditionsContent.revisions}</p>
        </LegalSection>

        <article className="warm-cta-panel p-7 sm:p-8 md:p-10">
          <span className="brand-chip inline-flex">Engagement de service</span>
          <h2 className="mt-5 font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            6. Garantie satisfaction
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">{conditionsContent.guarantee}</p>
        </article>

        <LegalSection title="7. Politique d’annulation et de remboursement">
          <BulletList items={conditionsContent.cancellation} />
        </LegalSection>

        <LegalSection title="8. Droits d’utilisation et propriété intellectuelle">
          <div className="space-y-4 text-base leading-8 text-[color:var(--site-muted)]">
            {conditionsContent.intellectualProperty.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </LegalSection>

        <LegalSection title="9. Vente à distance">
          <BulletList items={conditionsContent.distanceSelling} />
        </LegalSection>

        <LegalSection title="10. Droit applicable">
          <p className="text-base leading-8 text-[color:var(--site-muted)]">{conditionsContent.governingLaw}</p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--site-soft)]">{complianceNotes.legalReview}</p>
        </LegalSection>

        <article className="brand-card p-7 sm:p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight text-[color:var(--site-heading)] md:text-3xl">
            Consulter les autres informations utiles
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href={legalLinks.legal}
              className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold"
            >
              Mentions légales
            </Link>
            <Link
              href={legalLinks.privacy}
              className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 py-3 text-center font-semibold"
            >
              Confidentialité
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
