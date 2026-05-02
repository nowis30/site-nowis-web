'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  createdAt?: string;
  updatedAt?: string;
  type: string;
  status: string;
  contactId: string | null;
  contactName: string | null;
  calendarConnectionId?: string | null;
  meetingUrl?: string | null;
  organizationId?: string | null;
  workshopRequestId?: string | null;
  workshopRequestTitle?: string | null;
  songRequestId?: string | null;
  songRequestTitle?: string | null;
  location?: string | null;
  notes?: string | null;
  source?: 'appointment' | 'workshop_appointment' | 'workshop_availability' | 'google_calendar' | 'microsoft_calendar' | 'calendly';
  organizationName?: string | null;
};

type OptionItem = { id: string; label: string };
type LinkedRequestOption = { id: string; label: string; contactId: string | null; organizationId: string | null };

type AppointmentDetail = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: string;
  type: string;
  appointmentType: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contact: { id: string; fullName: string | null; email: string | null; phone: string | null } | null;
  organization: { id: string; name: string } | null;
  workshopRequest: { id: string; title: string; status: string } | null;
  songRequest: { id: string; title: string | null; occasion: string | null; status: string } | null;
};

type WorkshopDetail = {
  id: string;
  title: string;
  status: string;
  organizationId: string | null;
  organizationName: string | null;
  contactId: string | null;
  clientId: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  location: string | null;
  estimatedParticipants: number | null;
  finalPrice: string | null;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  internalNotes: string | null;
  organization: { id: string; name: string } | null;
  contact: { id: string; fullName: string; email: string | null; phone: string | null } | null;
  client: { id: string; fullName: string; email: string | null; phone: string | null } | null;
};

const TYPE_LABELS: Record<string, string> = {
  VISIT: 'Visite',
  CALL: 'Appel',
  FOLLOWUP: 'Suivi',
  MEETING: 'Rencontre',
  INSPECTION: 'Inspection',
  DEADLINE: 'Échéance',
  REMINDER: 'Rappel',
  WORKSHOP: 'Atelier',
  SONG_MEETING: 'Rencontre chanson',
  OTHER: 'Autre',
  AVAILABILITY: 'Disponibilité',
  GOOGLE: 'Google',
  MICROSOFT: 'Microsoft',
  CALENDLY: 'Calendly',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  DONE: 'Terminé',
};

function toTypeLabel(value: string) {
  return TYPE_LABELS[value] || value;
}

function toStatusLabel(value: string) {
  return STATUS_LABELS[value] || value;
}

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}

function durationText(startAt: string, endAt: string) {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function buildOutlookHref(email: string) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
}

function buildTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

function mapAppointmentToEvent(item: AppointmentDetail, fallback: CalendarEventItem): CalendarEventItem {
  return {
    ...fallback,
    id: item.id,
    title: item.title,
    description: item.description,
    startAt: item.startAt,
    endAt: item.endAt,
    type: item.type,
    status: item.status,
    contactId: item.contact?.id || null,
    contactName: item.contact?.fullName || null,
    organizationId: item.organization?.id || null,
    organizationName: item.organization?.name || null,
    workshopRequestId: item.workshopRequest?.id || null,
    workshopRequestTitle: item.workshopRequest?.title || null,
    songRequestId: item.songRequest?.id || null,
    songRequestTitle: item.songRequest?.title || item.songRequest?.occasion || null,
    location: item.location,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

interface Props {
  event: CalendarEventItem;
  contacts: OptionItem[];
  organizations: OptionItem[];
  workshopRequests: LinkedRequestOption[];
  songRequests: LinkedRequestOption[];
  onClose: () => void;
  onUpdated: (item: CalendarEventItem) => void;
  onDeleted: (eventId: string, workshopRequestId?: string | null) => void;
}

export function CrmCalendarEventDetailPanel({
  event,
  contacts,
  organizations,
  workshopRequests,
  songRequests,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetail | null>(null);
  const [workshopDetail, setWorkshopDetail] = useState<WorkshopDetail | null>(null);
  const [editAppointment, setEditAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    title: event.title,
    description: event.description || '',
    startAt: toLocalInputValue(event.startAt),
    endAt: toLocalInputValue(event.endAt),
    type: event.type,
    status: event.status,
    contactId: event.contactId || '',
    organizationId: event.organizationId || '',
    workshopRequestId: event.workshopRequestId || '',
    songRequestId: event.songRequestId || '',
    location: event.location || '',
    notes: event.notes || '',
  });
  const [workshopForm, setWorkshopForm] = useState({
    startAt: '',
    endAt: '',
    location: '',
    status: 'EN_ATTENTE_RDV',
    internalNotes: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });

  const isAppointment = !event.source || event.source === 'appointment';

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        if (isAppointment) {
          const response = await fetch(`/api/crm/appointments/${event.id}`, { cache: 'no-store' });
          const data = await response.json().catch(() => null) as { item?: AppointmentDetail; error?: string } | null;
          if (!response.ok) throw new Error(data?.error || 'Lecture rendez-vous impossible');
          if (cancelled) return;
          const item = data?.item || null;
          setAppointmentDetail(item);
          if (item) {
            setAppointmentForm({
              title: item.title,
              description: item.description || '',
              startAt: toLocalInputValue(item.startAt),
              endAt: toLocalInputValue(item.endAt),
              type: item.type,
              status: item.status,
              contactId: item.contact?.id || '',
              organizationId: item.organization?.id || '',
              workshopRequestId: item.workshopRequest?.id || '',
              songRequestId: item.songRequest?.id || '',
              location: item.location || '',
              notes: item.notes || '',
            });
          }
          return;
        }

        const workshopId = event.workshopRequestId;
        if (!workshopId) return;
        const response = await fetch(`/api/crm/workshop-requests/${workshopId}`, { cache: 'no-store' });
        const data = await response.json().catch(() => null) as { item?: WorkshopDetail; error?: string } | null;
        if (!response.ok) throw new Error(data?.error || 'Lecture atelier impossible');
        if (cancelled) return;
        const item = data?.item || null;
        setWorkshopDetail(item);
        if (item) {
          setWorkshopForm({
            startAt: item.startAt ? toLocalInputValue(item.startAt) : '',
            endAt: item.endAt ? toLocalInputValue(item.endAt) : '',
            location: item.location || '',
            status: item.status,
            internalNotes: item.internalNotes || '',
            contactPerson: item.contactPerson || '',
            contactEmail: item.contactEmail || '',
            contactPhone: item.contactPhone || '',
          });
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Erreur inconnue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [event.id, event.source, event.workshopRequestId, isAppointment]);

  const detailContact = useMemo(() => {
    if (appointmentDetail?.contact) return appointmentDetail.contact;
    if (workshopDetail?.contact) return workshopDetail.contact;
    if (workshopDetail?.client) return workshopDetail.client;
    return null;
  }, [appointmentDetail, workshopDetail]);

  async function saveAppointment() {
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!appointmentForm.title.trim()) {
      setError('Le titre est obligatoire.');
      setSaving(false);
      return;
    }

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[calendar] click Modifier appointment', event.id);
      }
      const response = await fetch(`/api/crm/appointments/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: appointmentForm.title,
          description: appointmentForm.description,
          startAt: fromLocalInputValue(appointmentForm.startAt),
          endAt: fromLocalInputValue(appointmentForm.endAt),
          type: appointmentForm.type,
          status: appointmentForm.status,
          contactId: appointmentForm.contactId,
          organizationId: appointmentForm.organizationId,
          workshopRequestId: appointmentForm.workshopRequestId,
          songRequestId: appointmentForm.songRequestId,
          location: appointmentForm.location,
          notes: appointmentForm.notes,
          calendarConnectionId: event.calendarConnectionId || '',
        }),
      });
      const data = await response.json().catch(() => null) as { item?: AppointmentDetail; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Modification impossible');
      if (!data?.item) throw new Error('Réponse incomplète');

      const mapped = mapAppointmentToEvent(data.item, event);
      onUpdated(mapped);
      setAppointmentDetail(data.item);
      setEditAppointment(false);
      setMessage('Rendez-vous modifié.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function patchAppointmentStatus(status: 'CONFIRMED' | 'DONE' | 'CANCELLED') {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/appointments/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: appointmentForm.title,
          description: appointmentForm.description,
          startAt: fromLocalInputValue(appointmentForm.startAt),
          endAt: fromLocalInputValue(appointmentForm.endAt),
          type: appointmentForm.type,
          status,
          contactId: appointmentForm.contactId,
          organizationId: appointmentForm.organizationId,
          workshopRequestId: appointmentForm.workshopRequestId,
          songRequestId: appointmentForm.songRequestId,
          location: appointmentForm.location,
          notes: appointmentForm.notes,
          calendarConnectionId: event.calendarConnectionId || '',
        }),
      });
      const data = await response.json().catch(() => null) as { item?: AppointmentDetail; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Mise a jour impossible');
      if (!data?.item) throw new Error('Réponse incomplète');

      const mapped = mapAppointmentToEvent(data.item, event);
      onUpdated(mapped);
      setAppointmentDetail(data.item);
      setAppointmentForm((current) => ({ ...current, status }));
      setMessage('Statut mis à jour.');
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAppointment() {
    if (!confirm('Confirmer la suppression/annulation du rendez-vous ?')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[calendar] click Supprimer appointment', event.id);
      }
      const response = await fetch(`/api/crm/appointments/${event.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Suppression impossible');
      onDeleted(event.id, event.workshopRequestId);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkshop() {
    if (!event.workshopRequestId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${event.workshopRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: workshopForm.status,
          startAt: workshopForm.startAt ? fromLocalInputValue(workshopForm.startAt) : null,
          endAt: workshopForm.endAt ? fromLocalInputValue(workshopForm.endAt) : null,
          location: workshopForm.location,
          internalNotes: workshopForm.internalNotes,
          contactPerson: workshopForm.contactPerson,
          contactEmail: workshopForm.contactEmail,
          contactPhone: workshopForm.contactPhone,
        }),
      });
      const data = await response.json().catch(() => null) as { item?: WorkshopDetail; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Modification atelier impossible');

      onUpdated({
        ...event,
        startAt: workshopForm.startAt ? fromLocalInputValue(workshopForm.startAt) : event.startAt,
        endAt: workshopForm.endAt ? fromLocalInputValue(workshopForm.endAt) : event.endAt,
        status: workshopForm.status,
        location: workshopForm.location,
      });
      setMessage('Atelier modifié.');
    } catch (workshopError) {
      setError(workshopError instanceof Error ? workshopError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function archiveWorkshop() {
    if (!event.workshopRequestId) return;
    if (!confirm('Confirmer l\'archivage/annulation de l\'atelier ?')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${event.workshopRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Archivage impossible');
      onDeleted(event.id, event.workshopRequestId);
      onClose();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function copyInfo() {
    const lines = [
      `Titre: ${event.title}`,
      `Debut: ${new Date(event.startAt).toLocaleString('fr-CA')}`,
      `Fin: ${new Date(event.endAt).toLocaleString('fr-CA')}`,
      `Type: ${toTypeLabel(event.type)}`,
      `Statut: ${toStatusLabel(event.status)}`,
      event.location ? `Lieu: ${event.location}` : null,
      event.contactName ? `Contact: ${event.contactName}` : null,
      event.organizationName ? `Organisation: ${event.organizationName}` : null,
    ].filter(Boolean).join('\n');

    await navigator.clipboard.writeText(lines);
    setMessage('Informations copiées.');
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-slate-950/75 backdrop-blur-sm">
      <button type="button" aria-label="Fermer" className="absolute inset-0" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
        <section
          className="pointer-events-auto relative z-[1001] w-full max-w-3xl rounded-t-[1.6rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl shadow-black/50 sm:rounded-[1.6rem] sm:p-6"
          style={{ maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Détail calendrier</p>
              <h3 className="mt-1 text-xl font-semibold text-white">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{toStatusLabel(event.status)} · {toTypeLabel(event.type)}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white">Fermer</button>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200 sm:grid-cols-2">
            <p><span className="text-slate-500">Date:</span> {new Date(event.startAt).toLocaleDateString('fr-CA')}</p>
            <p><span className="text-slate-500">Heure:</span> {new Date(event.startAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><span className="text-slate-500">Durée:</span> {durationText(event.startAt, event.endAt)}</p>
            <p><span className="text-slate-500">Lieu:</span> {event.location || appointmentDetail?.location || workshopDetail?.location || '—'}</p>
            <p><span className="text-slate-500">Contact:</span> {detailContact?.fullName || event.contactName || '—'}</p>
            <p><span className="text-slate-500">Organisation:</span> {appointmentDetail?.organization?.name || workshopDetail?.organization?.name || event.organizationName || '—'}</p>
            {event.workshopRequestId ? <p><span className="text-slate-500">Atelier lié:</span> {event.workshopRequestTitle || event.workshopRequestId}</p> : null}
            {event.songRequestId ? <p><span className="text-slate-500">Demande chanson:</span> {event.songRequestTitle || event.songRequestId}</p> : null}
            {appointmentDetail?.createdAt ? <p><span className="text-slate-500">Créé le:</span> {new Date(appointmentDetail.createdAt).toLocaleString('fr-CA')}</p> : null}
            {appointmentDetail?.updatedAt ? <p><span className="text-slate-500">Modifié le:</span> {new Date(appointmentDetail.updatedAt).toLocaleString('fr-CA')}</p> : null}
            {(event.notes || appointmentDetail?.notes || workshopDetail?.internalNotes) ? <p className="sm:col-span-2"><span className="text-slate-500">Notes:</span> {event.notes || appointmentDetail?.notes || workshopDetail?.internalNotes}</p> : null}
          </div>

          {loading ? <p className="mt-3 text-sm text-slate-400">Chargement...</p> : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}

          {isAppointment ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Actions rendez-vous</p>
                <button type="button" onClick={() => setEditAppointment((v) => !v)} className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:text-white">{editAppointment ? 'Fermer le formulaire' : 'Modifier'}</button>
              </div>

              {editAppointment ? (
                <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className="mb-1 block text-xs text-slate-400">Titre</span><input value={appointmentForm.title} onChange={(e) => setAppointmentForm((c) => ({ ...c, title: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Début</span><input type="datetime-local" value={appointmentForm.startAt} onChange={(e) => setAppointmentForm((c) => ({ ...c, startAt: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Fin</span><input type="datetime-local" value={appointmentForm.endAt} onChange={(e) => setAppointmentForm((c) => ({ ...c, endAt: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Type</span><select value={appointmentForm.type} onChange={(e) => setAppointmentForm((c) => ({ ...c, type: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{Object.keys(TYPE_LABELS).map((k) => <option key={k} value={k}>{toTypeLabel(k)}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Statut</span><select value={appointmentForm.status} onChange={(e) => setAppointmentForm((c) => ({ ...c, status: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{Object.keys(STATUS_LABELS).map((k) => <option key={k} value={k}>{toStatusLabel(k)}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Contact</span><select value={appointmentForm.contactId} onChange={(e) => setAppointmentForm((c) => ({ ...c, contactId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Aucun</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Organisation</span><select value={appointmentForm.organizationId} onChange={(e) => setAppointmentForm((c) => ({ ...c, organizationId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Aucune</option>{organizations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Atelier lié</span><select value={appointmentForm.workshopRequestId} onChange={(e) => setAppointmentForm((c) => ({ ...c, workshopRequestId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Aucun</option>{workshopRequests.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Demande chanson liée</span><select value={appointmentForm.songRequestId} onChange={(e) => setAppointmentForm((c) => ({ ...c, songRequestId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Aucune</option>{songRequests.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs text-slate-400">Lieu</span><input value={appointmentForm.location} onChange={(e) => setAppointmentForm((c) => ({ ...c, location: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                  <label className="sm:col-span-2"><span className="mb-1 block text-xs text-slate-400">Notes</span><textarea rows={3} value={appointmentForm.notes} onChange={(e) => setAppointmentForm((c) => ({ ...c, notes: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                  <label className="sm:col-span-2"><span className="mb-1 block text-xs text-slate-400">Description</span><textarea rows={2} value={appointmentForm.description} onChange={(e) => setAppointmentForm((c) => ({ ...c, description: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => void saveAppointment()} disabled={saving || !editAppointment} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Enregistrer</button>
                <button type="button" onClick={() => void patchAppointmentStatus('CONFIRMED')} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Marquer confirmé</button>
                <button type="button" onClick={() => void patchAppointmentStatus('DONE')} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Marquer terminé</button>
                <button type="button" onClick={() => void patchAppointmentStatus('CANCELLED')} disabled={saving} className="rounded-xl border border-red-800/60 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">Marquer annulé</button>
                <button type="button" onClick={() => void deleteAppointment()} disabled={saving} className="rounded-xl border border-red-800/60 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">Supprimer / Annuler</button>
                <button type="button" onClick={() => void copyInfo()} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white">Copier les infos</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Actions atelier</p>
              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
                <label><span className="mb-1 block text-xs text-slate-400">Début</span><input type="datetime-local" value={workshopForm.startAt} onChange={(e) => setWorkshopForm((c) => ({ ...c, startAt: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                <label><span className="mb-1 block text-xs text-slate-400">Fin</span><input type="datetime-local" value={workshopForm.endAt} onChange={(e) => setWorkshopForm((c) => ({ ...c, endAt: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                <label><span className="mb-1 block text-xs text-slate-400">Lieu</span><input value={workshopForm.location} onChange={(e) => setWorkshopForm((c) => ({ ...c, location: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                <label><span className="mb-1 block text-xs text-slate-400">Statut</span><select value={workshopForm.status} onChange={(e) => setWorkshopForm((c) => ({ ...c, status: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{['EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                <label><span className="mb-1 block text-xs text-slate-400">Responsable</span><input value={workshopForm.contactPerson} onChange={(e) => setWorkshopForm((c) => ({ ...c, contactPerson: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                <label><span className="mb-1 block text-xs text-slate-400">Courriel</span><input value={workshopForm.contactEmail} onChange={(e) => setWorkshopForm((c) => ({ ...c, contactEmail: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                <label><span className="mb-1 block text-xs text-slate-400">Téléphone</span><input value={workshopForm.contactPhone} onChange={(e) => setWorkshopForm((c) => ({ ...c, contactPhone: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
                <label className="sm:col-span-2"><span className="mb-1 block text-xs text-slate-400">Notes internes</span><textarea rows={3} value={workshopForm.internalNotes} onChange={(e) => setWorkshopForm((c) => ({ ...c, internalNotes: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => void saveWorkshop()} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Modifier l'atelier</button>
                <button type="button" onClick={() => void archiveWorkshop()} disabled={saving} className="rounded-xl border border-red-800/60 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">Archiver / Annuler atelier</button>
                <button type="button" onClick={() => void copyInfo()} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white">Copier les infos</button>
                {event.workshopRequestId ? <Link href={`/crm/workshop-requests/${event.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir fiche atelier</Link> : null}
                {event.workshopRequestId ? <Link href={`/crm/invoices?workshopId=${event.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Créer facture</Link> : null}
                {event.workshopRequestId ? <Link href={`/crm/submissions?workshopId=${event.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Créer soumission</Link> : null}
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {detailContact?.id ? <Link href={`/crm/contacts/${detailContact.id}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir fiche contact</Link> : null}
            {(appointmentDetail?.organization?.id || workshopDetail?.organization?.id || event.organizationId) ? <Link href={`/crm/organizations/${appointmentDetail?.organization?.id || workshopDetail?.organization?.id || event.organizationId || ''}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir fiche organisation</Link> : null}
            {event.songRequestId ? <Link href={`/crm/song-requests/${event.songRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir demande chanson</Link> : null}
            {(detailContact?.email || workshopForm.contactEmail) ? <a href={buildOutlookHref(detailContact?.email || workshopForm.contactEmail)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Envoyer un courriel</a> : null}
            {(detailContact?.phone || workshopForm.contactPhone) ? <a href={buildTelHref(detailContact?.phone || workshopForm.contactPhone)} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Appeler</a> : null}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
