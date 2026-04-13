import { notFound } from 'next/navigation';
import { getPublishedListingBySlug } from '@/lib/logements';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);

  if (!logement) {
    return {
      title: 'Réservation - Logement introuvable - NOWIS',
      description: 'Cette réservation n’est pas disponible car le logement est introuvable.',
    };
  }

  return {
    title: `Réserver - ${logement.title} - NOWIS`,
    description: `Réserver une visite pour ${logement.title} à ${logement.city}.`,
  };
}

export default async function BookingPage({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);
  if (!logement) {
    notFound();
  }

  return (
    <div className="bg-slate-50 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm md:p-10">
        <a href={`/logements/${logement.slug}`} className="text-sm font-semibold text-emerald-700 hover:underline">
          Retour au logement
        </a>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Reservation</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-950">Reserver une visite pour {logement.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          {logement.city}{logement.sector ? `, ${logement.sector}` : ''} • {logement.price.toLocaleString('fr-CA')} €
        </p>

        <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-slate-700">
          <p className="leading-7">
            {logement.bookingUrl
              ? 'Utilise le lien ci-dessous pour choisir une plage horaire disponible.'
              : "Aucun lien de reservation externe n'est configure pour ce logement. Utilise le contact direct pour planifier une visite."}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {logement.bookingUrl ? (
            <a href={logement.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800">
              Ouvrir la reservation
            </a>
          ) : null}
          <a href={`mailto:${logement.ownerEmail}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
            Contacter le proprietaire
          </a>
        </div>
      </div>
    </div>
  );
}
