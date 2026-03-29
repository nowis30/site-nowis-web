import { ClientPortalRequestGate } from '@/components/marketing/ClientPortalRequestGate';

export default function WorkshopRequestPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-slate-100">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Demande d'atelier</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.96] text-white md:text-6xl">Les demandes se font maintenant a partir du portail client</h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">Cette page est devenue une page d'acces. L'envoi de nouvelles demandes d'atelier se fait uniquement depuis votre espace client securise.</p>
      </div>
      <ClientPortalRequestGate nextPath="/client/workshops/nouveau" showBackToPortal />
    </main>
  );
}
