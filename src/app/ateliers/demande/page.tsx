import Link from 'next/link';
import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';

const GROUP_TYPES = new Set(['AINES_RESIDENCE', 'ECOLE', 'ENTREPRISE', 'COMMUNAUTAIRE', 'PRIVE', 'AUTRE']);

export default function WorkshopRequestPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const groupTypeParam = typeof searchParams?.groupType === 'string' ? searchParams.groupType : '';
  const nextPath = GROUP_TYPES.has(groupTypeParam)
    ? `/client/workshops/nouveau?groupType=${encodeURIComponent(groupTypeParam)}`
    : '/client/workshops/nouveau';
  const googleHref = `/api/client-auth/google/start?next=${encodeURIComponent(nextPath)}`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-[color:var(--site-text)]">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Demande d'atelier</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.96] text-[color:var(--site-heading)] md:text-6xl">Les demandes se font maintenant a partir du portail client</h1>
        <p className="mt-6 text-lg leading-8 text-[color:var(--site-text)]">Cette page est devenue une page d'acces. L'envoi de nouvelles demandes d'atelier se fait uniquement depuis votre espace client securise.</p>
      </div>
      <div className="space-y-4">
        <Link
          href={googleHref}
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-sm font-semibold text-white shadow-fire transition hover:brightness-110"
        >
          Continuer avec Google
        </Link>
        <p className="text-sm text-[color:var(--site-muted)]">Autre methode: inscription ou connexion classique via portail.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-[rgba(131,97,67,0.12)] bg-white/70 p-4">
        <ClientPortalRequestGate nextPath={nextPath} showBackToPortal />
      </div>
    </main>
  );
}
