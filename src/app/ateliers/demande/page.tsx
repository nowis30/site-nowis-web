import { WorkshopRequestForm } from '@/features/workshops/components/WorkshopRequestForm';

export default function WorkshopRequestPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-slate-100">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Demande d’atelier</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.96] text-white md:text-6xl">Parlez-nous de votre groupe, de vos objectifs et du créneau souhaité</h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">Ce formulaire permet de créer directement votre dossier atelier dans le CRM Nowis. Nous pourrons ensuite échanger, confirmer un rendez-vous et partager les documents utiles.</p>
      </div>
      <WorkshopRequestForm />
    </main>
  );
}
