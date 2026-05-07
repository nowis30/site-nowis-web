'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

type ContactOption = {
  id: string;
  fullName: string;
  email: string | null;
};

type OrganizationOption = {
  id: string;
  name: string;
};

type RequestOption = {
  id: string;
  label: string;
};

type ConnectionOption = {
  id: string;
  label: string;
  provider: string;
};

function buildCalendlyLink(baseUrl: string, startIso: string, contact?: ContactOption) {
  const url = new URL(baseUrl);
  url.searchParams.set('date', startIso);
  if (contact?.fullName) {
    url.searchParams.set('name', contact.fullName);
  }
  if (contact?.email) {
    url.searchParams.set('email', contact.email);
  }
  return url.toString();
}

export function CalendarCreateAppointmentPage({
  initialDate,
  contacts,
  organizations: _organizations,
  workshopRequests: _workshopRequests,
  songRequests: _songRequests,
  calendarConnections: _calendarConnections,
}: {
  initialDate?: string;
  contacts: ContactOption[];
  organizations: OrganizationOption[];
  workshopRequests: RequestOption[];
  songRequests: RequestOption[];
  calendarConnections: ConnectionOption[];
}) {
  const [selectedContactId, setSelectedContactId] = useState('');

  const selectedContact = useMemo(
    () => contacts.find((item) => item.id === selectedContactId),
    [contacts, selectedContactId],
  );

  const calendlyBaseUrl = process.env.NEXT_PUBLIC_CALENDLY_EVENT_URL ?? process.env.NEXT_PUBLIC_CALENDLY_URL;

  const calendlyLink = useMemo(() => {
    if (!calendlyBaseUrl) return null;
    const startIso = initialDate ? `${initialDate}T09:00:00.000Z` : new Date().toISOString();
    return buildCalendlyLink(calendlyBaseUrl, startIso, selectedContact);
  }, [calendlyBaseUrl, initialDate, selectedContact]);

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Calendrier</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Réserver un rendez-vous</h2>
          <p className="mt-2 text-sm text-slate-400">
            Les rendez-vous se réservent via Calendly pour éviter les conflits d&apos;horaire.
          </p>
        </div>
        <Link
          href="/crm/calendar"
          className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"
        >
          Retour calendrier
        </Link>
      </div>

      <div className="crm-surface space-y-5 p-5 lg:p-6">
        <div className="rounded-2xl border border-blue-600/30 bg-blue-950/20 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-200">Réservation via Calendly uniquement</p>
              <p className="mt-1 text-xs text-blue-300/80">
                La création manuelle de rendez-vous est désactivée pour éviter les conflits d&apos;horaire.
                Utilisez Calendly — le CRM se synchronise automatiquement via webhook dès qu&apos;une réservation est confirmée.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Contact à pré-remplir dans Calendly (optionnel)
          </label>
          <select
            value={selectedContactId}
            onChange={(event) => setSelectedContactId(event.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
          >
            <option value="">Aucun</option>
            {contacts.map((item) => (
              <option key={item.id} value={item.id}>{item.fullName}</option>
            ))}
          </select>
          {selectedContact?.email && (
            <p className="mt-1 text-xs text-slate-400">
              Email : {selectedContact.email}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 text-center space-y-4">
          {calendlyLink ? (
            <>
              <p className="text-sm text-slate-400">
                Cliquez pour ouvrir Calendly et sélectionner un horaire.
                {initialDate ? ` La date suggérée est le ${initialDate}.` : ''}
              </p>
              <a
                href={calendlyLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
              >
                <ExternalLink size={16} /> Ouvrir Calendly pour réserver
              </a>
              <p className="text-xs text-slate-500">
                Le rendez-vous apparaîtra dans le CRM après confirmation par webhook Calendly.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-amber-300">Lien Calendly non configuré.</p>
              <p className="text-xs text-slate-400">
                Ajoutez NEXT_PUBLIC_CALENDLY_EVENT_URL dans les variables d&apos;environnement Vercel.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
