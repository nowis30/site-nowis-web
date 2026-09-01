import Link from 'next/link';
import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';

const GROUP_LABELS = {
  AINES_RESIDENCE: 'Aînés / résidence',
  ECOLE: 'École',
  ENTREPRISE: 'Entreprise',
  COMMUNAUTAIRE: 'Communautaire',
  PRIVE: 'Privé',
  AUTRE: 'Autre groupe',
} as const;

type GroupType = keyof typeof GROUP_LABELS;

function getGroupType(value: string): GroupType | null {
  return Object.prototype.hasOwnProperty.call(GROUP_LABELS, value) ? (value as GroupType) : null;
}

export default function WorkshopRequestPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const groupTypeParam = typeof searchParams?.groupType === 'string' ? searchParams.groupType : '';
  const groupType = getGroupType(groupTypeParam);
  const nextPath = groupType
    ? `/client/workshops/nouveau?groupType=${encodeURIComponent(groupType)}`
    : '/client/workshops/nouveau';
  const googleHref = `/api/client-auth/google/start?next=${encodeURIComponent(nextPath)}`;

  return (
    <main className="px-4 py-12 text-[color:var(--site-text)] sm:px-6 sm:py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <section aria-labelledby="workshop-request-title" className="warm-cta-panel overflow-hidden p-6 sm:p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)] lg:items-start">
            <div>
              <span className="brand-chip inline-flex">Demande d’atelier</span>
              <h1
                id="workshop-request-title"
                className="brand-metal-text mt-5 max-w-3xl font-display text-4xl leading-[0.98] sm:text-5xl md:text-6xl"
              >
                Préparez votre demande dans le portail client
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
                Les nouvelles demandes d’atelier passent par votre espace client sécurisé. Vous pourrez y préciser votre groupe, vos objectifs et le format souhaité, puis suivre le dossier au même endroit.
              </p>

              {groupType ? (
                <p className="mt-5 inline-flex min-h-11 items-center rounded-2xl border border-black/10 bg-white/72 px-4 py-2 text-sm font-semibold text-[color:var(--site-heading)]">
                  Groupe sélectionné : {GROUP_LABELS[groupType]}
                </p>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={googleHref}
                  className="cta-primary inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-center text-sm font-semibold shadow-fire motion-safe:transition motion-safe:hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent-strong)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Continuer avec Google
                </Link>
                <Link
                  href="/ateliers"
                  className="cta-secondary inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent-strong)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Revoir les ateliers
                </Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-[color:var(--site-soft)]">
                Vous préférez une adresse courriel et un mot de passe? Les options d’inscription et de connexion sont disponibles juste en dessous.
              </p>
            </div>

            <aside className="brand-card p-5 sm:p-6" aria-label="Ce qu’il faut préparer">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">Avant de commencer</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--site-muted)]">
                <li className="flex gap-3"><span aria-hidden="true">•</span><span>Le type de groupe et le nombre approximatif de participants.</span></li>
                <li className="flex gap-3"><span aria-hidden="true">•</span><span>La durée souhaitée et quelques disponibilités.</span></li>
                <li className="flex gap-3"><span aria-hidden="true">•</span><span>Votre objectif principal : création, découverte de l’IA ou activité de groupe.</span></li>
              </ul>
            </aside>
          </div>
        </section>

        <div className="mt-8">
          <ClientPortalRequestGate
            nextPath={nextPath}
            title="Choisissez comment ouvrir votre espace client"
            description="Créez votre accès ou connectez-vous avec votre compte existant. Votre demande d’atelier sera ensuite ouverte directement dans le bon formulaire."
            showBackToPortal
          />
        </div>
      </div>
    </main>
  );
}
