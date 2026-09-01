import Link from 'next/link';
import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';
import { SONG_REQUEST_NEXT_PATH, WORKSHOP_REQUEST_NEXT_PATH } from '@/lib/client-portal-routes';
import { buildMetadata } from '@/lib/seo';

type RequestType = 'song' | 'workshop' | 'general';
type SearchParams = Record<string, string | string[] | undefined>;

const REQUEST_OPTIONS: Array<{
  type: RequestType;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}> = [
  {
    type: 'song',
    eyebrow: 'Création musicale',
    title: 'Chanson personnalisée',
    description: 'Transformez une histoire, un souvenir ou une émotion en chanson avec un suivi dans votre portail client.',
    href: '/soumission/nouvelle?type=chanson',
  },
  {
    type: 'workshop',
    eyebrow: 'Atelier',
    title: 'Atelier créatif ou IA',
    description: 'Préparez une demande pour votre groupe, votre organisation, votre école ou votre activité.',
    href: '/soumission/nouvelle?type=atelier',
  },
  {
    type: 'general',
    eyebrow: 'Autre projet',
    title: 'Demande générale',
    description: 'Pour une question, un mandat Web, une idée ou un besoin qui ne correspond pas aux deux parcours ci-dessus.',
    href: '/soumission/nouvelle?type=general',
  },
];

export const metadata = buildMetadata({
  title: 'Faire une demande | Création Nowis',
  description:
    'Choisissez le bon parcours pour envoyer une demande à Création Nowis : chanson personnalisée, atelier ou demande générale.',
  path: '/soumission/nouvelle',
});

function resolveRequestType(raw: string | string[] | undefined): RequestType {
  const firstValue = Array.isArray(raw) ? raw[0] : raw;
  const value = (firstValue || '').trim().toLowerCase();

  if (value === 'chanson' || value === 'song') return 'song';
  if (value === 'atelier' || value === 'workshop') return 'workshop';
  return 'general';
}

export default async function PublicSubmissionRequestPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) || {};
  const requestType = resolveRequestType(resolvedSearchParams.type);

  return (
    <main className="site-background min-h-screen text-[color:var(--site-text)]">
      <section className="section-soft border-b border-[rgba(131,97,67,0.12)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <span className="brand-chip inline-flex">Demande NOWIS</span>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-tight text-[color:var(--site-heading)] sm:text-5xl md:text-6xl">
            Choisissez le bon parcours pour votre projet
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
            Les demandes de chanson et d’atelier passent maintenant par le portail client sécurisé. Vous gardez ainsi vos échanges et le suivi de votre projet au même endroit.
          </p>
        </div>
      </section>

      <section aria-labelledby="request-type-title" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--site-accent-strong)]">Type de demande</p>
          <h2 id="request-type-title" className="mt-3 font-display text-3xl text-[color:var(--site-heading)] sm:text-4xl">
            Par quoi voulez-vous commencer?
          </h2>
        </div>

        <nav aria-label="Choisir un type de demande" className="mt-7 grid gap-4 md:grid-cols-3">
          {REQUEST_OPTIONS.map((option) => {
            const active = option.type === requestType;

            return (
              <Link
                key={option.type}
                href={option.href}
                aria-current={active ? 'page' : undefined}
                className={`brand-card group flex min-h-48 flex-col rounded-[1.6rem] p-5 transition motion-reduce:transition-none sm:p-6 ${
                  active
                    ? 'border-[rgba(201,117,71,0.48)] shadow-card'
                    : 'hover:-translate-y-0.5 hover:border-[rgba(201,117,71,0.28)] motion-reduce:hover:translate-y-0'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent-strong)] focus-visible:ring-offset-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]">{option.eyebrow}</span>
                  {active ? <span className="brand-chip inline-flex shrink-0">Sélectionné</span> : null}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[color:var(--site-heading)]">{option.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted)]">{option.description}</p>
                <span className="mt-auto pt-5 text-sm font-semibold text-[color:var(--site-accent-strong)]" aria-hidden="true">
                  Choisir →
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 md:mt-10">
          {requestType === 'song' ? (
            <ClientPortalRequestGate
              nextPath={SONG_REQUEST_NEXT_PATH}
              title="Envoyer une demande de chanson dans votre portail"
              description="Créez votre accès ou connectez-vous, puis décrivez votre histoire, le style souhaité et les détails utiles. Votre demande restera liée à votre dossier client."
              showBackToPortal
            />
          ) : requestType === 'workshop' ? (
            <ClientPortalRequestGate
              nextPath={WORKSHOP_REQUEST_NEXT_PATH}
              title="Préparer une demande d’atelier dans votre portail"
              description="Créez votre accès ou connectez-vous pour préciser votre groupe, le nombre de participants, le lieu, la date souhaitée et les objectifs de l’atelier."
              showBackToPortal
            />
          ) : (
            <section aria-labelledby="general-request-title" className="warm-spotlight-panel p-6 shadow-card sm:p-8 md:p-10">
              <span className="brand-chip inline-flex">Demande générale</span>
              <h2 id="general-request-title" className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">
                Expliquez simplement ce dont vous avez besoin
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)]">
                Pour un projet Web, une collaboration, une question ou une idée qui ne nécessite pas le portail client, utilisez la page Contact. Vous pourrez donner le contexte sans remplir un long formulaire inutile.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/contact" className="cta-primary min-h-12 w-full justify-center px-6 py-3 text-center sm:w-auto">
                  Aller au contact
                </Link>
                <Link href="/services" className="cta-secondary min-h-12 w-full justify-center px-6 py-3 text-center sm:w-auto">
                  Voir les services
                </Link>
              </div>
            </section>
          )}
        </div>

        <p className="mt-6 text-sm leading-6 text-[color:var(--site-muted)]">
          Pour protéger vos données et éviter les demandes en double, l’ancien formulaire public n’est plus utilisé pour les chansons et les ateliers.
        </p>
      </section>
    </main>
  );
}
