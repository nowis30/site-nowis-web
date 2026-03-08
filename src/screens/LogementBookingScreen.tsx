'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { Logement } from '@/types';

interface BookingScreenProps {
  logement: Logement;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const LogementBookingScreen: React.FC<BookingScreenProps> = ({ logement }) => {
  const hasBooking = Boolean(logement.bookingUrl?.trim());
  const [embedOpen, setEmbedOpen] = useState(false);

  const shareUrl = useMemo(() => logement.bookingUrl?.trim() || '', [logement.bookingUrl]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Réserver une visite</h1>
        <p className="mt-2 text-slate-400">
          {`Logement : ${logement.title} (${logement.city})`}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Résumé du logement</h2>
            <div className="mt-4 space-y-2 text-slate-300">
              <p>
                <span className="font-semibold text-white">Prix :</span> {formatPrice(logement.price)} / mois
              </p>
              <p>
                <span className="font-semibold text-white">Localisation :</span> {logement.sector}, {logement.city}
              </p>
              <p>
                <span className="font-semibold text-white">Chambres :</span> {logement.bedrooms} • <span className="font-semibold text-white">Salles de bain :</span> {logement.bathrooms}
              </p>
              <p>
                <span className="font-semibold text-white">Disponibilité :</span>{' '}
                {logement.status === 'approved' ? 'Disponible' : 'Indisponible'}
              </p>
            </div>
          </div>

          {hasBooking ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold text-white">Lien de réservation</h2>
              <p className="mt-2 text-slate-300">
                Ce lien vous permet de choisir un créneau disponible dans l&#39;agenda du propriétaire.
              </p>
              <a
                href={logement.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-green-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                Ouvrir le calendrier de réservation
              </a>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  Copier le lien
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  {embedOpen ? 'Masquer l’intégration' : 'Voir l’intégration'}
                </button>
              </div>
              {embedOpen && shareUrl && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
                  <p className="text-sm font-semibold text-white">Intégration du calendrier</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Si l’intégration ne s’affiche pas, utilisez le bouton « Ouvrir le calendrier ».
                  </p>
                  <div className="mt-4 h-96 rounded-lg overflow-hidden bg-black">
                    <iframe
                      title="Calendrier de réservation"
                      src={shareUrl}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold text-white">Pas de calendrier configuré</h2>
              <p className="mt-2 text-slate-300">
                Le propriétaire n&#39;a pas encore associé un lien de réservation à ce logement.
                Nous vous invitons à le contacter directement pour convenir d&#39;une visite.
              </p>
              <div className="mt-4">
                <a
                  href={`mailto:${logement.ownerEmail}?subject=Demande%20de%20visite%20-%20${encodeURIComponent(
                    logement.title
                  )}`}
                  className="inline-flex w-full"
                >
                  <Button variant="primary" className="w-full">
                    Contacter le propriétaire
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">Infos du propriétaire</h3>
            <p className="mt-3 text-slate-300">{logement.ownerName}</p>
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              <p>📧 {logement.ownerEmail}</p>
              <p>📞 {logement.ownerPhone}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">Besoin d&#39;aide ?</h3>
            <p className="mt-2 text-slate-300">
              Si vous avez des questions sur le logement, le processus de visite ou les conditions,
              n&#39;hésitez pas à nous contacter.
            </p>
            <Link href="/contact">
              <Button variant="secondary" className="w-full">
                Contacter NOWIS
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};
