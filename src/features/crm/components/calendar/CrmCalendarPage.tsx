'use client';

import { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, EventChangeArg, EventInput } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';

type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: string;
  status: string;
  contactId: string | null;
  propertyId: string | null;
  contactName: string | null;
  propertyName: string | null;
  source?: 'appointment' | 'workshop_appointment' | 'workshop_availability';
  organizationName?: string | null;
};

type OptionItem = { id: string; label: string };

type CalendarPrefill = {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  type?: string;
  status?: string;
  contactId?: string;
  propertyId?: string;
};

const TYPE_COLORS: Record<string, string> = {
  VISIT: '#2563eb',
  CALL: '#16a34a',
  FOLLOWUP: '#ca8a04',
  MEETING: '#7c3aed',
  INSPECTION: '#ea580c',
  DEADLINE: '#dc2626',
  REMINDER: '#64748b',
  WORKSHOP: '#9333ea',
  AVAILABILITY: '#0f766e',
};

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}

function defaultEnd(startIso: string) {
  const date = new Date(startIso);
  date.setHours(date.getHours() + 1);
  return date.toISOString();
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

export function CrmCalendarPage({
  initialAppointments,
  contacts,
  properties,
  initialPrefill,
}: {
  initialAppointments: CalendarEventItem[];
  contacts: OptionItem[];
  properties: OptionItem[];
  initialPrefill?: CalendarPrefill;
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterContactId, setFilterContactId] = useState('ALL');
  const [contactSearch, setContactSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    type: 'MEETING',
    status: 'PENDING',
    contactId: '',
    propertyId: '',
  });
  const [prefillApplied, setPrefillApplied] = useState(false);

  const visibleContacts = useMemo(
    () => contacts.filter((item) => item.label.toLowerCase().includes(contactSearch.toLowerCase())),
    [contactSearch, contacts],
  );

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterContactId !== 'ALL' && item.contactId !== filterContactId) return false;
    if (contactSearch && item.contactName && !item.contactName.toLowerCase().includes(contactSearch.toLowerCase())) return false;
    if (contactSearch && !item.contactName && filterContactId === 'ALL') return false;
    return true;
  }), [appointments, contactSearch, filterContactId, filterStatus, filterType]);

  const selectedEvent = useMemo(
    () => appointments.find((item) => item.id === selectedEventId) || null,
    [appointments, selectedEventId],
  );

  const events = useMemo(
    () => filteredAppointments.map((item) => ({
      ...toEventInput(item),
      editable: item.source !== 'workshop_appointment' && item.source !== 'workshop_availability',
      startEditable: item.source !== 'workshop_appointment' && item.source !== 'workshop_availability',
      durationEditable: item.source !== 'workshop_appointment' && item.source !== 'workshop_availability',
      classNames: item.id === selectedEventId ? ['ring-2', 'ring-primary-300'] : [],
    })),
    [filteredAppointments, selectedEventId],
  );

  useEffect(() => {
    if (!initialPrefill || prefillApplied) return;

    const nowIso = new Date().toISOString();
    const safeStart = initialPrefill.startAt && !Number.isNaN(new Date(initialPrefill.startAt).getTime())
      ? initialPrefill.startAt
      : nowIso;
    const safeEnd = initialPrefill.endAt && !Number.isNaN(new Date(initialPrefill.endAt).getTime())
      ? initialPrefill.endAt
      : defaultEnd(safeStart);

    setEditingId(null);
    setForm({
      title: initialPrefill.title || '',
      description: initialPrefill.description || '',
      startAt: toLocalInputValue(safeStart),
      endAt: toLocalInputValue(safeEnd),
      type: initialPrefill.type || 'MEETING',
      status: initialPrefill.status || 'PENDING',
      contactId: initialPrefill.contactId || '',
      propertyId: initialPrefill.propertyId || '',
    });
    setError(null);
    setModalOpen(true);
    setPrefillApplied(true);
  }, [initialPrefill, prefillApplied]);

  function openCreateModal(startAt: string) {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      startAt: toLocalInputValue(startAt),
      endAt: toLocalInputValue(defaultEnd(startAt)),
      type: 'MEETING',
      status: 'PENDING',
      contactId: '',
      propertyId: '',
    });
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(item: CalendarEventItem) {
    if (item.source === 'workshop_appointment' || item.source === 'workshop_availability') {
      setSelectedEventId(item.id);
      setModalOpen(false);
      return;
    }
    setSelectedEventId(item.id);
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      startAt: toLocalInputValue(item.startAt),
      endAt: toLocalInputValue(item.endAt),
      type: item.type,
      status: item.status,
      contactId: item.contactId || '',
      propertyId: item.propertyId || '',
    });
    setError(null);
    setModalOpen(true);
  }

  async function saveAppointment() {
    setSaving(true);
    setError(null);

    if (!form.title.trim()) {
      setSaving(false);
      setError('Le titre est obligatoire.');
      return;
    }

    if (!form.startAt || !form.endAt) {
      setSaving(false);
      setError('Les dates de début et de fin sont obligatoires.');
      return;
    }

    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setSaving(false);
      setError('La date de fin doit être postérieure à la date de début.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      startAt: fromLocalInputValue(form.startAt),
      endAt: fromLocalInputValue(form.endAt),
      type: form.type,
      status: form.status,
      contactId: form.contactId,
      propertyId: form.propertyId,
    };

    try {
      const response = await fetch(editingId ? `/api/crm/appointments/${editingId}` : '/api/crm/appointments', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Enregistrement impossible');
      }

      const item = data.item as CalendarEventItem;
      setAppointments((current) => {
        const next = current.filter((entry) => entry.id !== item.id);
        const contactName = contacts.find((entry) => entry.id === (item.contactId || form.contactId))?.label || null;
        const propertyName = properties.find((entry) => entry.id === (item.propertyId || form.propertyId))?.label || null;
        return [...next, {
          id: item.id,
          title: item.title,
          description: item.description,
          startAt: item.startAt,
          endAt: item.endAt,
          type: item.type,
          status: item.status,
          contactId: item.contactId,
          propertyId: item.propertyId,
          contactName,
          propertyName,
        }].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      });
      setSelectedEventId(item.id);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAppointment() {
    if (!editingId) return;
    if (!confirm('Supprimer ce rendez-vous ?')) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/appointments/${editingId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Suppression impossible');
      }
      setAppointments((current) => current.filter((entry) => entry.id !== editingId));
      setSelectedEventId((current) => (current === editingId ? null : current));
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function applyEventMove(change: EventChangeArg) {
    const current = appointments.find((entry) => entry.id === change.event.id);
    if (!current || !change.event.start || !change.event.end || current.source === 'workshop_appointment' || current.source === 'workshop_availability') return;

    const payload = {
      title: current.title,
      description: current.description || '',
      startAt: change.event.start.toISOString(),
      endAt: change.event.end.toISOString(),
      type: current.type,
      status: current.status,
      contactId: current.contactId || '',
      propertyId: current.propertyId || '',
    };

    const response = await fetch(`/api/crm/appointments/${current.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      change.revert();
      return;
    }

    setAppointments((items) => items.map((entry) => entry.id === current.id ? { ...entry, startAt: payload.startAt, endAt: payload.endAt } : entry));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Planification</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Calendrier CRM</h2>
          <p className="mt-2 text-sm text-slate-400">Vue mois, semaine et jour avec rendez-vous CRM, rendez-vous atelier et plages de disponibilité du mardi et du jeudi.</p>
        </div>
        <button onClick={() => openCreateModal(new Date().toISOString())} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500">
          Nouveau rendez-vous
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="crm-surface space-y-4 p-4 lg:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Filtres</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Mini sidebar</h3>
          </div>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Type</span>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
              <option value="ALL">Tous les types</option>
              {Object.keys(TYPE_COLORS).map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-400">Statut</span>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
              <option value="ALL">Tous les statuts</option>
              {['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'].map((key) => <option key={key} value={key}>{key}</option>)}
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
            <p className="text-xs text-slate-500">Résultats</p>
            <p className="mt-2 text-2xl font-semibold text-white">{filteredAppointments.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Événement sélectionné</p>
            {selectedEvent ? (
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p className="font-medium text-white">{selectedEvent.title}</p>
                <p>{selectedEvent.organizationName || selectedEvent.contactName || 'Sans contact'}</p>
                <p>{selectedEvent.status} · {selectedEvent.type}</p>
                {selectedEvent.source === 'appointment' || !selectedEvent.source ? <button onClick={() => openEditModal(selectedEvent)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Modifier</button> : <p className="text-xs text-slate-500">Événement atelier synchronisé</p>}
              </div>
            ) : <p className="mt-3 text-sm text-slate-400">Cliquez un rendez-vous pour afficher le détail rapide.</p>}
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
            dateClick={(info: DateClickArg) => openCreateModal(info.date.toISOString())}
            eventClick={(info: EventClickArg) => {
              const item = info.event.extendedProps as CalendarEventItem;
              setSelectedEventId(item.id);
              if (item.source === 'appointment' || !item.source) {
                openEditModal(item);
              }
            }}
            eventDrop={applyEventMove}
            eventResize={applyEventMove}
          />
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Calendrier</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{editingId ? 'Modifier le rendez-vous' : 'Créer un rendez-vous'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-sm text-slate-400 hover:text-white">Fermer</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Titre</span>
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Début</span>
                <input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Fin</span>
                <input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Type</span>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {Object.keys(TYPE_COLORS).map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Statut</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'].map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Contact</span>
                <select value={form.contactId} onChange={(event) => setForm((current) => ({ ...current, contactId: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Aucun</option>
                  {contacts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Bien</span>
                <select value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Aucun</option>
                  {properties.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Description</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                {editingId ? (
                  <button onClick={deleteAppointment} disabled={saving} className="rounded-2xl border border-red-800/60 px-4 py-2.5 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">
                    Supprimer
                  </button>
                ) : null}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">Annuler</button>
                <button onClick={saveAppointment} disabled={saving} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}