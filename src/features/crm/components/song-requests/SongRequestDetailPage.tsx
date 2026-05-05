'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SongRequestFilesPanel } from './SongRequestFilesPanel';
import { AppointmentSelector } from '@/features/crm/components/appointments/AppointmentSelector';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: { fullName: string } | null;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
};

type SongRequestDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  language: string;
  songType: string;
  tempo: 'LENT' | 'MOYEN' | 'RAPIDE';
  occasion: string;
  eventType: string;
  recipientName: string;
  specialMessage: string | null;
  style: string;
  mood: string;
  theme: string;
  description: string;
  inspirations: string | null;
  lyrics: string | null;
  structureVerse: string;
  structureChorus: string;
  structureBridge: string | null;
  fileUrl: string | null;
  details: string;
  budget: string | number | null;
  desiredDeadline: string | null;
  meetingDate: string | null;
  scheduledAt: string | null;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number | null;
  meetingType: string | null;
  location: string | null;
  meetingNotes: string | null;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  convertedAppointmentId: string | null;
  convertedInvoiceId: string | null;
  createdAt: string;
  contact: { id: string; fullName: string; email: string | null; phone: string | null };
  organization: { id: string; name: string } | null;
  appointments: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    status: string;
    type: string;
    location: string | null;
  }>;
  activities: ActivityItem[];
  tasks: TaskItem[];
  relatedCommercialQuotes: Array<{
    id: string;
    quoteNumber: string;
    title: string;
    status: string;
    totalAmount: string | number;
    convertedToInvoiceId: string | null;
    createdAt: string;
  }>;
  relatedInvoices: Array<{
    id: string;
    number: string;
    status: string;
    amount: string | number;
    issueDate: string;
    dueDate: string;
  }>;
  files: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    category: string;
    commercialQuoteId: string | null;
    invoiceId: string | null;
    visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
    createdAt: string;
  }>;
};

const STATUS_LABELS: Record<SongRequestDetail['status'], string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  QUOTED: 'Soumission',
  IN_PROGRESS: 'En cours',
  IN_PRODUCTION: 'En production',
  DELIVERED: 'Livré',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
};

interface SongRequestDetailPageProps {
  item: SongRequestDetail;
  clientPortalUrl: string;
  canCreateCommercialQuote: boolean;
  canCreateInvoice: boolean;
}

export function SongRequestDetailPage({ item, clientPortalUrl, canCreateCommercialQuote, canCreateInvoice }: SongRequestDetailPageProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState({
    title: item.title ? `Rencontre chanson - ${item.title}` : `Rencontre chanson - ${item.fullName}`,
    startAt: item.startAt ? item.startAt.slice(0, 16) : '',
    endAt: item.endAt ? item.endAt.slice(0, 16) : '',
    durationMinutes: String(item.durationMinutes || 45),
    meetingType: item.meetingType || 'visio',
    location: item.location || '',
    meetingNotes: item.meetingNotes || '',
    appointmentId: '',
  });

  async function runAction(action: 'mark_contacted' | 'convert_appointment' | 'mark_in_production' | 'mark_delivered') {
    setLoadingAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/crm/song-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Action impossible');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  const budgetLabel = item.budget === null ? '—' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(item.budget));

  const blockingQuote = item.relatedCommercialQuotes.find(
    (q) => q.status === 'ACCEPTED' || q.status === 'CONVERTED',
  );
  const hasBlockingQuote = !!blockingQuote;
  const acceptedQuoteInvoiceId = blockingQuote?.convertedToInvoiceId ?? null;
  const hasLinkedInvoice =
    !!item.convertedInvoiceId || !!acceptedQuoteInvoiceId || item.relatedInvoices.length > 0;
  const firstInvoiceId =
    item.convertedInvoiceId ??
    acceptedQuoteInvoiceId ??
    item.relatedInvoices[0]?.id ??
    null;
  const canCreateInvoiceNow = hasBlockingQuote && !hasLinkedInvoice;
  const clientPortalDocuments = item.files
    .filter((file) => file.visibility === 'CLIENT_VISIBLE' && (file.commercialQuoteId || file.invoiceId || file.category === 'quote' || file.category === 'invoice'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function planSongMeeting() {
    setLoadingAction('plan_meeting');
    setError(null);
    try {
      const response = await fetch(`/api/crm/song-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'plan_meeting',
          title: planning.title,
          startAt: planning.startAt ? new Date(planning.startAt).toISOString() : undefined,
          endAt: planning.endAt ? new Date(planning.endAt).toISOString() : undefined,
          durationMinutes: Number(planning.durationMinutes || 45),
          meetingType: planning.meetingType,
          location: planning.location,
          meetingNotes: planning.meetingNotes,
          organizationId: item.organization?.id,
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Planification impossible');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  async function linkAppointment(appointmentId: string) {
    if (!appointmentId) return;
    setLoadingAction('link_appointment');
    setError(null);
    try {
      const response = await fetch(`/api/crm/song-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_appointment',
          appointmentId,
          organizationId: item.organization?.id,
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Liaison impossible');
      setPlanning((current) => ({ ...current, appointmentId: '' }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  async function unlinkAppointment(appointmentId: string) {
    setLoadingAction(`unlink_${appointmentId}`);
    setError(null);
    try {
      const response = await fetch(`/api/crm/song-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink_appointment', appointmentId }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Déliaison impossible');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  async function cancelAppointment(appointmentId: string) {
    setLoadingAction(`cancel_${appointmentId}`);
    setError(null);
    try {
      const response = await fetch(`/api/crm/appointments/${appointmentId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Annulation impossible');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeSongMeetingFromCalendar() {
    setLoadingAction('remove_song_calendar');
    setError(null);
    try {
      const response = await fetch('/api/crm/calendar/remove-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'song-request', sourceId: item.id }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Retrait du calendrier impossible');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeAppointmentFromCalendar(appointmentId: string) {
    setLoadingAction(`remove_${appointmentId}`);
    setError(null);
    try {
      const response = await fetch('/api/crm/calendar/remove-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'appointment', sourceId: appointmentId }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Retrait du calendrier impossible');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/crm/calendar" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Calendrier
          </Link>
          <p className="text-xs uppercase tracking-wide text-slate-500">Demande chanson</p>
          <h2 className="text-2xl font-semibold text-white">{item.fullName}</h2>
          <p className="text-sm text-slate-400">Soumise le {new Date(item.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
            {STATUS_LABELS[item.status]}
          </span>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white"
          >
            {isEditing ? 'Annuler l’édition' : 'Modifier'}
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-700/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      {hasBlockingQuote ? (
        <div className="rounded-xl border border-emerald-700/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300 flex items-start justify-between gap-4 flex-wrap">
          <span>
            ✓ Une soumission acceptée existe déjà pour cette chanson. Vous pouvez maintenant créer ou envoyer une facture.{' '}
            {hasLinkedInvoice
              ? 'Une facture est déjà liée à ce dossier.'
              : 'Tu peux maintenant créer et envoyer la facture.'}
          </span>
          {!hasLinkedInvoice && (
            <a
              href={`/crm/invoices?songRequestId=${item.id}`}
              className="rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-900/30 hover:text-white"
            >
              Créer une facture →
            </a>
          )}
          {hasLinkedInvoice && firstInvoiceId && (
            <a
              href={`/crm/invoices/${firstInvoiceId}`}
              className="rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-900/30 hover:text-white"
            >
              Voir la facture →
            </a>
          )}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Informations de la demande</h3>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">Titre</dt><dd className="text-white">{item.title}</dd></div>
            <div><dt className="text-slate-500">Nom</dt><dd className="text-white">{item.fullName}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-white">{item.email}</dd></div>
            <div><dt className="text-slate-500">Téléphone</dt><dd className="text-white">{item.phone}</dd></div>
            <div><dt className="text-slate-500">Langue</dt><dd className="text-white">{item.language}</dd></div>
            <div><dt className="text-slate-500">Type de chanson</dt><dd className="text-white">{item.songType}</dd></div>
            <div><dt className="text-slate-500">Tempo</dt><dd className="text-white">{item.tempo}</dd></div>
            <div><dt className="text-slate-500">Occasion</dt><dd className="text-white">{item.eventType || item.occasion}</dd></div>
            <div><dt className="text-slate-500">Personne concernée</dt><dd className="text-white">{item.recipientName}</dd></div>
            <div><dt className="text-slate-500">Style</dt><dd className="text-white">{item.style}</dd></div>
            <div><dt className="text-slate-500">Ambiance</dt><dd className="text-white">{item.mood}</dd></div>
            <div><dt className="text-slate-500">Thème</dt><dd className="text-white">{item.theme}</dd></div>
            <div><dt className="text-slate-500">Budget</dt><dd className="text-white">{budgetLabel}</dd></div>
            <div>
              <dt className="text-slate-500">Délai souhaité</dt>
              <dd className="text-white">{item.desiredDeadline ? new Date(item.desiredDeadline).toLocaleDateString('fr-CA') : '—'}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.description}</p>
          </div>

          {item.specialMessage ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Message spécial</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.specialMessage}</p>
            </div>
          ) : null}

          {item.inspirations ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Inspirations</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.inspirations}</p>
            </div>
          ) : null}

          {item.lyrics ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Paroles fournies</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.lyrics}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Couplet</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.structureVerse}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Refrain</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.structureChorus}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pont</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.structureBridge || '—'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Actions</h3>
            <div className="mt-4 space-y-2">
              <Link href={`/crm/contacts/${item.contact.id}`} className="block rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-primary-300">
                Ouvrir le contact
              </Link>

              {canCreateCommercialQuote ? (
                hasBlockingQuote ? (
                  <div className="rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" title="Soumission déjà acceptée pour cette demande.">
                    Créer une soumission (bloqué)
                  </div>
                ) : (
                  <Link
                    href={`/crm/commercial-quotes/new?songRequestId=${item.id}`}
                    className="block rounded-lg border border-indigo-700/50 px-3 py-2 text-sm text-indigo-200 hover:border-indigo-500/60 hover:text-indigo-100"
                  >
                    Créer une soumission
                  </Link>
                )
              ) : null}

              {canCreateInvoice && hasLinkedInvoice && firstInvoiceId ? (
                <Link
                  href={`/crm/invoices/${firstInvoiceId}`}
                  className="block rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200 hover:border-emerald-500/60 hover:text-emerald-100"
                >
                  Voir la facture
                </Link>
              ) : null}

              {canCreateInvoice && canCreateInvoiceNow ? (
                <Link
                  href={`/crm/invoices?songRequestId=${item.id}`}
                  className="block rounded-lg border border-emerald-600/70 bg-emerald-900/20 px-3 py-2 text-sm font-medium text-emerald-200 hover:border-emerald-500/80 hover:text-emerald-100"
                >
                  Créer une facture
                </Link>
              ) : null}

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full rounded-lg border border-primary-700/60 px-3 py-2 text-left text-sm text-primary-200 hover:bg-primary-900/30 hover:text-white"
                >
                  Planifier rencontre / Modifier
                </button>
              ) : null}

              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => runAction('mark_contacted')}
                    disabled={loadingAction !== null}
                    className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-indigo-500/40 hover:text-indigo-300 disabled:opacity-60"
                  >
                    {loadingAction === 'mark_contacted' ? 'Mise à jour...' : 'Marquer comme contacté'}
                  </button>

                  <button
                    type="button"
                    onClick={() => runAction('convert_appointment')}
                    disabled={loadingAction !== null}
                    className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-60"
                  >
                    {loadingAction === 'convert_appointment' ? 'Conversion...' : 'Convertir en rendez-vous'}
                  </button>

                  <button
                    type="button"
                    onClick={() => runAction('mark_in_production')}
                    disabled={loadingAction !== null}
                    className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-fuchsia-500/40 hover:text-fuchsia-300 disabled:opacity-60"
                  >
                    {loadingAction === 'mark_in_production' ? 'Mise à jour...' : 'Marquer en production'}
                  </button>

                  <button
                    type="button"
                    onClick={() => runAction('mark_delivered')}
                    disabled={loadingAction !== null}
                    className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-60"
                  >
                    {loadingAction === 'mark_delivered' ? 'Mise à jour...' : 'Marquer comme livré'}
                  </button>

                  <button
                    type="button"
                    onClick={removeSongMeetingFromCalendar}
                    disabled={loadingAction !== null}
                    className="w-full rounded-lg border border-red-700/60 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-900/30 hover:text-red-200 disabled:opacity-60"
                  >
                    {loadingAction === 'remove_song_calendar' ? 'Retrait...' : 'Retirer la rencontre du calendrier'}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Informations internes</h3>
            <div className="mt-3 space-y-1">
              <p><span className="text-slate-500">Contact:</span> {item.contact.fullName}</p>
              <p><span className="text-slate-500">Email:</span> {item.contact.email ?? '—'}</p>
              <p><span className="text-slate-500">Téléphone:</span> {item.contact.phone ?? '—'}</p>
              <p><span className="text-slate-500">Source:</span> {item.source}</p>
              <p><span className="text-slate-500">Organisation:</span> {item.organization?.name || '—'}</p>
              <p><span className="text-slate-500">Date rencontre:</span> {item.meetingDate ? new Date(item.meetingDate).toLocaleString('fr-CA') : '—'}</p>
              <p><span className="text-slate-500">Soumission/facture liee:</span> {item.convertedInvoiceId || '—'}</p>
              {item.meetingNotes ? <p><span className="text-slate-500">Notes internes:</span> {item.meetingNotes}</p> : null}
              {item.fileUrl ? (
                <p className="break-all">
                  <span className="text-slate-500">Lien dossier:</span>{' '}
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200">
                    Ouvrir le fichier joint
                  </a>
                </p>
              ) : null}
              <p className="break-all"><span className="text-slate-500">Lien portail client:</span> {clientPortalUrl}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Planifier une rencontre chanson</h3>
            {!isEditing ? (
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Mode lecture seule. Utilisez le bouton Modifier pour planifier ou ajuster la rencontre.</p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-primary-500/40 px-3 py-2 text-sm text-primary-200 hover:text-white"
                >
                  Activer l’édition
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
              <label>
                <span className="mb-1 block text-xs text-slate-400">Titre</span>
                <input value={planning.title} onChange={(event) => setPlanning((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs text-slate-400">Début</span>
                  <input type="datetime-local" value={planning.startAt} onChange={(event) => setPlanning((current) => ({ ...current, startAt: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-slate-400">Fin</span>
                  <input type="datetime-local" value={planning.endAt} onChange={(event) => setPlanning((current) => ({ ...current, endAt: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  <span className="mb-1 block text-xs text-slate-400">Durée (min)</span>
                  <input type="number" min={1} max={1440} value={planning.durationMinutes} onChange={(event) => setPlanning((current) => ({ ...current, durationMinutes: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-slate-400">Type</span>
                  <select value={planning.meetingType} onChange={(event) => setPlanning((current) => ({ ...current, meetingType: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                    <option value="telephone">Téléphone</option>
                    <option value="visio">Visio</option>
                    <option value="en_personne">En personne</option>
                    <option value="autre">Autre</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs text-slate-400">Lieu / lien</span>
                  <input value={planning.location} onChange={(event) => setPlanning((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                </label>
              </div>
              <label>
                <span className="mb-1 block text-xs text-slate-400">Notes internes</span>
                <textarea rows={3} value={planning.meetingNotes} onChange={(event) => setPlanning((current) => ({ ...current, meetingNotes: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
              </label>
              <button type="button" onClick={planSongMeeting} disabled={loadingAction === 'plan_meeting'} className="rounded-lg border border-primary-500/40 px-3 py-2 text-sm text-primary-200 hover:text-white disabled:opacity-60">
                {loadingAction === 'plan_meeting' ? 'Planification...' : 'Planifier la rencontre'}
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rendez-vous liés</h3>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.appointments.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {item.appointments.length === 0 ? <p className="text-sm text-slate-500">Aucun rendez-vous lié.</p> : item.appointments.map((appointment) => (
            <article key={appointment.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{appointment.title}</p>
                <span className="text-xs text-slate-400">{appointment.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{new Date(appointment.startAt).toLocaleString('fr-CA')} - {new Date(appointment.endAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-slate-500">{appointment.type} {appointment.location ? `· ${appointment.location}` : ''}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => cancelAppointment(appointment.id)} disabled={loadingAction === `cancel_${appointment.id}`} className="rounded-md border border-amber-700/60 px-2 py-1 text-xs text-amber-300 hover:bg-amber-900/30 hover:text-amber-200 disabled:opacity-60">Annuler</button>
                <button type="button" onClick={() => unlinkAppointment(appointment.id)} disabled={loadingAction === `unlink_${appointment.id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-60">Délier</button>
                <button type="button" onClick={() => removeAppointmentFromCalendar(appointment.id)} disabled={loadingAction === `remove_${appointment.id}`} className="rounded-md border border-red-700/60 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30 hover:text-red-200 disabled:opacity-60">Retirer du calendrier</button>
                <Link href={`/crm/appointments/${appointment.id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white">Ouvrir</Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4">
          {isEditing ? (
            <AppointmentSelector
              onSelect={linkAppointment}
              loading={loadingAction === 'link_appointment'}
              contactId={item.contact.id}
              organizationId={item.organization?.id || null}
              onlyUnlinked={true}
              excludeTypes={[]}
              label="Lier un rendez-vous existant"
              placeholder="Chercher par titre, contact, date..."
            />
          ) : (
            <p className="text-sm text-slate-500">Passez en mode édition pour lier un rendez-vous existant.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Soumissions liées</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.relatedCommercialQuotes.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {item.relatedCommercialQuotes.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune soumission liée.</p>
            ) : (
              item.relatedCommercialQuotes.map((quote) => (
                <article key={quote.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{quote.quoteNumber}</p>
                    <span className={`text-xs ${quote.status === 'CONVERTED' ? 'text-emerald-300' : quote.status === 'ACCEPTED' ? 'text-amber-300' : 'text-slate-400'}`}>
                      {quote.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{quote.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString('fr-CA')} · {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(quote.totalAmount))}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/crm/commercial-quotes/${quote.id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white">Ouvrir</Link>
                    {quote.convertedToInvoiceId ? <Link href={`/crm/invoices/${quote.convertedToInvoiceId}`} className="rounded-md border border-emerald-700/60 px-2 py-1 text-xs text-emerald-300 hover:text-emerald-200">Facture liée</Link> : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Factures liées</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.relatedInvoices.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {item.relatedInvoices.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune facture liée.</p>
            ) : (
              item.relatedInvoices.map((invoice) => (
                <article key={invoice.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{invoice.number}</p>
                    <span className="text-xs text-slate-400">{invoice.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Émise le {new Date(invoice.issueDate).toLocaleDateString('fr-CA')} · Échéance {new Date(invoice.dueDate).toLocaleDateString('fr-CA')}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(invoice.amount))}</p>
                  <div className="mt-2">
                    <Link href={`/crm/invoices/${invoice.id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white">Ouvrir</Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Documents client</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{clientPortalDocuments.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {clientPortalDocuments.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun devis/facture visible dans le portail client pour le moment.</p>
            ) : (
              clientPortalDocuments.map((file) => (
                <article key={file.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{file.originalName || file.filename}</p>
                    <span className={`text-xs ${file.invoiceId ? 'text-emerald-300' : 'text-sky-300'}`}>
                      {file.invoiceId ? 'Facture' : 'Devis'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Ajouté le {new Date(file.createdAt).toLocaleDateString('fr-CA')}</p>
                  <div className="mt-2">
                    <a href={file.url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white">
                      Ouvrir le document
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Activités liées</h3>
          <div className="mt-4 space-y-3">
            {item.activities.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune activité liée.</p>
            ) : (
              item.activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  {activity.description ? <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{activity.description}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(activity.createdAt).toLocaleString('fr-CA')} {activity.user ? `· ${activity.user.fullName}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tâches liées</h3>
          <div className="mt-4 space-y-3">
            {item.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tâche liée.</p>
            ) : (
              item.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  {task.description ? <p className="mt-1 text-xs text-slate-300">{task.description}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {task.status} · {task.priority}
                    {task.dueDate ? ` · Échéance ${new Date(task.dueDate).toLocaleDateString('fr-CA')}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Dossier de chanson</h3>
        <p className="mt-1 text-xs text-slate-500">Fichiers liés à cette demande (audio final, paroles, vidéo, image, autres documents).</p>
        <div className="mt-4">
          <SongRequestFilesPanel
            mode="admin"
            songRequestId={item.id}
            contactId={item.contact.id}
            files={item.files}
          />
        </div>
      </div>
    </section>
  );
}
