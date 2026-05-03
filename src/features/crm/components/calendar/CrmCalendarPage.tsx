'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventChangeArg, EventClickArg, EventInput } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';

type CalendarEventItem = {
  id: string;
  sourceType: 'appointment' | 'workshop' | 'song-request' | 'external' | 'availability';
  sourceId: string;
  canRemoveFromCalendar: boolean;
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

const TYPE_COLORS: Record<string, string> = {
  VISIT: '#2563eb',
  CALL: '#16a34a',
  FOLLOWUP: '#ca8a04',
  MEETING: '#7c3aed',
  INSPECTION: '#ea580c',
  DEADLINE: '#dc2626',
  REMINDER: '#64748b',
  WORKSHOP: '#9333ea',
  SONG_MEETING: '#2563eb',
  OTHER: '#475569',
  AVAILABILITY: '#0f766e',
  GOOGLE: '#0b57d0',
  MICROSOFT: '#0078d4',
  CALENDLY: '#0f766e',
};

const TYPE_LABELS: Record<string, string> = {
  VISIT: 'Visite',
  CALL: 'Appel',
  FOLLOWUP: 'Suivi',
  MEETING: 'Rencontre',
  INSPECTION: 'Inspection',
  DEADLINE: 'Echeance',
  REMINDER: 'Rappel',
  WORKSHOP: 'Atelier',
  SONG_MEETING: 'Rencontre chanson',
  OTHER: 'Autre',
  AVAILABILITY: 'Disponibilite',
  GOOGLE: 'Google',
  MICROSOFT: 'Microsoft',
  CALENDLY: 'Calendly',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirme',
  CANCELLED: 'Annule',
  DONE: 'Termine',
};

function toTypeLabel(value: string) {
  return TYPE_LABELS[value] || value;
}

function toStatusLabel(value: string) {
  return STATUS_LABELS[value] || value;
}

function toEventInput(item: CalendarEventItem): EventInput {
  return {
    id: item.id,
    title: item.title,
    start: item.startAt,
    end: item.endAt,
    backgroundColor: TYPE_COLORS[item.type] || '#2563eb',
    borderColor: TYPE_COLORS[item.type] || '#2563eb',
    extendedProps: item,
  };
}

function toCalendarEventId(sourceType: CalendarEventItem['sourceType'], sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

export function CrmCalendarPage({
  initialAppointments,
  contacts,
  organizations,
}: {
  initialAppointments: CalendarEventItem[];
  contacts: OptionItem[];
  organizations: OptionItem[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterContactId, setFilterContactId] = useState('ALL');
  const [contactSearch, setContactSearch] = useState('');

  const visibleContacts = useMemo(
    () => contacts.filter((item) => item.label.toLowerCase().includes(contactSearch.toLowerCase())),
    [contactSearch, contacts],
  );

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterSource !== 'ALL' && item.sourceType !== filterSource) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterContactId !== 'ALL' && item.contactId !== filterContactId) return false;
    if (contactSearch && item.contactName && !item.contactName.toLowerCase().includes(contactSearch.toLowerCase())) return false;
    if (contactSearch && !item.contactName && filterContactId === 'ALL') return false;
    return true;
  }), [appointments, contactSearch, filterContactId, filterSource, filterStatus, filterType]);

  const selectedEvent = useMemo(
    () => appointments.find((item) => item.id === selectedEventId) || null,
    [appointments, selectedEventId],
  );

  const events = useMemo(
    () => filteredAppointments.map((item) => ({
      ...toEventInput(item),
      editable: item.sourceType === 'appointment',
      startEditable: item.sourceType === 'appointment',
      durationEditable: item.sourceType === 'appointment',
      classNames: item.id === selectedEventId ? ['ring-2', 'ring-primary-300'] : [],
    })),
    [filteredAppointments, selectedEventId],
  );

  function navigateToEvent(item: CalendarEventItem) {
    if (item.sourceType === 'workshop' || item.sourceType === 'availability') {
      router.push(item.workshopRequestId ? `/crm/workshop-requests/${item.workshopRequestId}` : `/crm/workshop-requests`);
      return;
    }
    if (item.sourceType === 'external') {
      return;
    }
    if (item.sourceType === 'song-request' && item.songRequestId) {
      router.push(`/crm/song-requests/${item.songRequestId}`);
      return;
    }
    if (item.type === 'WORKSHOP' && item.workshopRequestId) {
      router.push(`/crm/workshop-requests/${item.workshopRequestId}`);
    } else if (item.type === 'SONG_MEETING' && item.songRequestId) {
      router.push(`/crm/song-requests/${item.songRequestId}`);
    } else {
      router.push(`/crm/appointments/${item.sourceId}`);
    }
  }

  function navigateToCreatePage(startAtIso: string) {
    const date = new Date(startAtIso);
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    const dateParam = safeDate.toISOString().slice(0, 10);
    router.push(`/crm/calendrier/nouveau?date=${dateParam}`);
  }

  async function removeFromCalendar(item: CalendarEventItem) {
    if (!item.canRemoveFromCalendar) return;
    if (!confirm('Retirer cet événement du calendrier CRM ?')) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/calendar/remove-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: item.sourceType, sourceId: item.sourceId }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Retrait du calendrier impossible');
      }

      setAppointments((current) => current.filter((entry) => {
        if (entry.id === item.id) return false;
        if (item.sourceType === 'workshop' && entry.workshopRequestId === item.sourceId) return false;
        if (item.sourceType === 'song-request' && entry.songRequestId === item.sourceId) return false;
        return true;
      }));
      setSelectedEventId(null);
      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function applyEventMove(change: EventChangeArg) {
    const current = appointments.find((entry) => entry.id === change.event.id);
    if (!current || !change.event.start || !change.event.end || current.sourceType !== 'appointment') return;

    const response = await fetch(`/api/crm/appointments/${current.sourceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: current.title,
        description: current.description || '',
        startAt: change.event.start.toISOString(),
        endAt: change.event.end.toISOString(),
        type: current.type,
        status: current.status,
        contactId: current.contactId || '',
        organizationId: current.organizationId || '',
        workshopRequestId: current.workshopRequestId || '',
        songRequestId: current.songRequestId || '',
        location: current.location || '',
        notes: current.notes || '',
        calendarConnectionId: current.calendarConnectionId || '',
      }),
    });

    if (!response.ok) {
      change.revert();
      return;
    }

    setAppointments((items) => items.map((entry) => entry.id === current.id ? { ...entry, startAt: change.event.start!.toISOString(), endAt: change.event.end!.toISOString() } : entry));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Planification</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Calendrier CRM</h2>
          <p className="mt-2 text-sm text-slate-400">Vue mois, semaine et jour avec rendez-vous CRM, ateliers et disponibilités.</p>
        </div>
        <button onClick={() => navigateToCreatePage(new Date().toISOString())} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500">
          Nouveau rendez-vous
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="crm-surface space-y-4 p-4 lg:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Filtres</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Panneau rapide</h3>
          </div>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Type</span>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
              <option value="ALL">Tous les types</option>
              {Object.keys(TYPE_COLORS).map((key) => <option key={key} value={key}>{toTypeLabel(key)}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Source</span>
            <select value={filterSource} onChange={(event) => setFilterSource(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
              <option value="ALL">Toutes les sources</option>
              <option value="appointment">Rendez-vous</option>
              <option value="workshop">Ateliers</option>
              <option value="song-request">Demandes chanson</option>
              <option value="external">Externe</option>
              <option value="availability">Disponibilités</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Statut</span>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
              <option value="ALL">Tous les statuts</option>
              {['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'].map((key) => <option key={key} value={key}>{toStatusLabel(key)}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Recherche contact</span>
            <input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Nom du contact" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white" />
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Contact</span>
            <select value={filterContactId} onChange={(event) => setFilterContactId(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
              <option value="ALL">Tous les contacts</option>
              {visibleContacts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <p className="text-xs text-slate-500">Resultats</p>
            <p className="mt-2 text-2xl font-semibold text-white">{filteredAppointments.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Evenement selectionne</p>
            {selectedEvent ? (
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p className="font-medium text-white">{selectedEvent.title}</p>
                <p>{selectedEvent.organizationName || selectedEvent.contactName || 'Sans contact'}</p>
                <p>{toStatusLabel(selectedEvent.status)} · {toTypeLabel(selectedEvent.type)}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigateToEvent(selectedEvent)} className="rounded-xl border border-primary-600/60 bg-primary-950/30 px-3 py-2 text-xs text-primary-200 hover:bg-primary-900/40 hover:text-white">Ouvrir fiche</button>
                  {selectedEvent.canRemoveFromCalendar ? <button onClick={() => void removeFromCalendar(selectedEvent)} disabled={saving} className="rounded-xl border border-red-700/60 px-3 py-2 text-xs text-red-200 hover:bg-red-950/30 disabled:opacity-60">{saving ? 'Retrait...' : 'Retirer du calendrier'}</button> : null}
                  {selectedEvent.contactId ? <Link href={`/crm/contacts/${selectedEvent.contactId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Contact</Link> : null}
                </div>
                {process.env.NODE_ENV !== 'production' ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                    sourceType: {selectedEvent.sourceType} · sourceId: {selectedEvent.sourceId} · source: {selectedEvent.source || 'appointment'}
                  </div>
                ) : null}
              </div>
            ) : <p className="mt-3 text-sm text-slate-400">Cliquez un evenement pour afficher le detail.</p>}
          </div>
        </aside>

        <div className="crm-surface overflow-hidden p-4 transition-all duration-200 lg:p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            height="auto"
            locale={frLocale}
            editable
            selectable
            dayMaxEvents
            eventDisplay="block"
            events={events}
            eventClassNames="transition-all duration-200"
            dateClick={(info: DateClickArg) => navigateToCreatePage(info.date.toISOString())}
            eventClick={(info: EventClickArg) => {
              const item = info.event.extendedProps as CalendarEventItem;
              setSelectedEventId(item.id);
              navigateToEvent(item);
            }}
            eventDrop={applyEventMove}
            eventResize={applyEventMove}
          />
        </div>
      </div>
    </section>
  );
}
