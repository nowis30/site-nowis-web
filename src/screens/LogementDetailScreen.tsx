import Link from 'next/link';
import { Button, SectionTitle } from '@/components/ui';
import { LogementGallery } from '@/components/logements/LogementGallery';
import type { Listing } from '@/types';

interface LogementDetailScreenProps {
  logement: Listing;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const LogementDetailScreen: React.FC<LogementDetailScreenProps> = ({ logement }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <SectionTitle
        title={logement.title}
        subtitle={
          logement.status === 'approved'
            ? 'Disponible à la location – Réservez votre visite rapidement.'
            : 'Annonce en attente de validation ou non publiée.'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Gallery */}
        <div className="lg:col-span-2">
          <LogementGallery logement={logement} />
        </div>

        {/* Details */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-2xl font-bold text-white">{formatPrice(logement.price)}</p>
                <p className="text-sm text-slate-400">/ mois</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">
                {logement.status === 'approved' ? 'Disponible' : 'En attente'}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-slate-100">Localisation</p>
                <p>
                  {logement.sector}, {logement.city}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-100">Surface</p>
                <p>{logement.area} m²</p>
              </div>

              <div>
                <p className="font-semibold text-slate-100">Chambres</p>
                <p>{logement.bedrooms}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-100">Salles de bain</p>
                <p>{logement.bathrooms}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {logement.bookingUrl ? (
                <Link href={`/logements/${logement.slug}/reserver`}>
                  <Button variant="primary" className="w-full">
                    Prendre rendez-vous pour une visite
                  </Button>
                </Link>
              ) : (
                <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-slate-200">
                  <p className="font-semibold text-white">Réservation en ligne non disponible</p>
                  <p className="mt-2 text-slate-300">
                    Le propriétaire n'a pas encore configuré de lien de réservation en ligne.
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>📧 {logement.ownerEmail}</p>
                    <p>📞 {logement.ownerPhone}</p>
                  </div>
                </div>
              )}
              <a href={`mailto:${logement.ownerEmail}`} className="block w-full">
                <Button variant="secondary" className="w-full">
                  Contacter le propriétaire
                </Button>
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">Informations propriétaire</h3>
            <p className="mt-3 text-sm text-slate-300">
              {logement.ownerName}
            </p>
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              <p>📧 {logement.ownerEmail}</p>
              <p>📞 {logement.ownerPhone}</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Description</h2>
        <p className="text-slate-300 leading-relaxed">{logement.descriptionLong}</p>
      </section>
      {(logement.includedItems?.length || logement.excludedItems?.length) && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Inclus / Exclus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logement.includedItems?.length ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="font-semibold text-white mb-3">Inclus</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {logement.includedItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {logement.excludedItems?.length ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="font-semibold text-white mb-3">Exclus</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {logement.excludedItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Informations utiles</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-slate-300">
            <p>
              <span className="font-semibold text-white">Type :</span> {logement.propertyType || 'Non renseigné'}
            </p>
            <p>
              <span className="font-semibold text-white">Chauffage :</span>{' '}
              {logement.heating ?? 'Non précisé'}
            </p>
            <p>
              <span className="font-semibold text-white">Animaux :</span>{' '}
              {logement.petsAllowed === true
                ? 'Acceptés'
                : logement.petsAllowed === false
                ? 'Interdits'
                : 'Non précisé'}
            </p>
            <p>
              <span className="font-semibold text-white">Fumeurs :</span>{' '}
              {logement.smokingAllowed === true
                ? 'Autorisé'
                : logement.smokingAllowed === false
                ? 'Interdit'
                : 'Non précisé'}
            </p>
          </div>
          <div className="text-slate-300">
            <p>
              <span className="font-semibold text-white">Parking :</span>{' '}
              {logement.parking === true
                ? 'Inclus'
                : logement.parking === false
                ? 'Non inclus'
                : 'Non précisé'}
            </p>
            <p>
              <span className="font-semibold text-white">Meublé :</span>{' '}
              {logement.furnished === true
                ? 'Oui'
                : logement.furnished === false
                ? 'Non'
                : 'Non précisé'}
            </p>
            {logement.availabilityDate && (
              <p>
                <span className="font-semibold text-white">Disponible à partir du :</span>{' '}
                {new Date(logement.availabilityDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Disponibilités</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-slate-300">
            {logement.status === 'approved'
              ? 'Ce logement est actuellement disponible. Cliquez sur le bouton de réservation pour choisir un créneau.'
              : "Le logement n&#39;est pas disponible pour le moment. N&#39;hésitez pas à contacter le propriétaire pour une liste d'attente ou de futures disponibilités."}
          </p>
        </div>
      </section>
    </div>
  );
};
