/**
 * BookingScreen Component
 * Calendrier de réservation Cal.com intégré.
 * ÉDITABLE: Modifie le lien Cal.com dans .env.local
 */

'use client';

import React from 'react';
import { SectionTitle } from '@/components/ui';
import { getBookingEmbedUrl } from '@/lib/booking-link';

export const BookingScreen: React.FC = () => {
  const BOOKING_EMAIL = 'simonmorin@nowis.store';

  // URL d'iframe Cal.com centralisee
  const iframeUrl = getBookingEmbedUrl();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center">
        <SectionTitle
          title="Réserver une consultation"
          subtitle="Choisis ton créneau disponible dans le calendrier"
        />
      </div>

      {/* Cal.com Calendar Iframe */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
        <iframe
          src={iframeUrl}
          title="Calendrier de réservation - Création NOWIS"
          width="100%"
          height="800"
          frameBorder="0"
          className="w-full"
          style={{ minHeight: '700px' }}
          allow="camera; microphone; clipboard-write"
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-xl border-2 border-primary-200 shadow-md">
          <h3 className="text-xl font-bold text-primary-900 mb-4">✉️ Contact direct</h3>
          <p className="text-primary-800 mb-6">
            Préfères-tu nous écrire directement ? Contacte-nous par email :
          </p>
          <a
            href={`mailto:${BOOKING_EMAIL}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            📧 {BOOKING_EMAIL}
          </a>
        </div>

        {/* Consultation Info */}
        <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-8 rounded-xl border-2 border-secondary-200 shadow-md">
          <h3 className="text-xl font-bold text-secondary-900 mb-4">⏱️ À savoir</h3>
          <ul className="text-secondary-800 space-y-3">
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Consultations de 30 minutes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Réponse confirmée par email</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Lien Zoom envoyé 24h avant</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-center bg-gray-50 p-8 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions avant ta réservation ?</h3>
        <p className="text-gray-700">
          Envoie-nous un email détaillant ton projet, tes idées et tes objectifs. Nous analyserons ta demande et te proposerons les meilleures solutions.
        </p>
      </div>
    </div>
  );
};
