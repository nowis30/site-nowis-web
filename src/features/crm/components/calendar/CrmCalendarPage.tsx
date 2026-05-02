'use client';

import Link from 'next/link';
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

type OptionItem = { id: string; label: string };

type ConnectionOptionItem = {
  id: string;
  label: string;
  provider: string;
  status: string;
};

type LinkedRequestOption = {
  id: string;
  label: string;
  contactId: string | null;
  organizationId: string | null;
};

type CalendarPrefill = {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  type?: string;
  status?: string;
  contactId?: string;
  organizationId?: string;
  workshopRequestId?: string;
  songRequestId?: string;
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
  organizations,
  workshopRequests,
  songRequests,
  calendarConnections,
  initialPrefill,
}: {
  initialAppointments: CalendarEventItem[];
  contacts: OptionItem[];
  organizations: OptionItem[];
  workshopRequests: LinkedRequestOption[];
  songRequests: LinkedRequestOption[];
  calendarConnections: ConnectionOptionItem[];
  initialPrefill?: CalendarPrefill;
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetail | null>(null);
  const [workshopDetail, setWorkshopDetail] = useState<WorkshopDetail | null>(null);
  const [workshopSaving, setWorkshopSaving] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
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
    organizationId: '',
    workshopRequestId: '',
    songRequestId: '',
    location: '',
    notes: '',
    calendarConnectionId: '',
  });
  const [prefillApplied, setPrefillApplied] = useState(false);

  const visibleContacts = useMemo(
    () => contacts.filter((item) => item.label.toLowerCase().includes(contactSearch.toLowerCase())),
    [contactSearch, contacts],
  );

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterSource !== 'ALL' && (item.source || 'appointment') !== filterSource) return false;
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
      editable: item.source === 'appointment' || !item.source,
      startEditable: item.source === 'appointment' || !item.source,
      durationEditable: item.source === 'appointment' || !item.source,
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
      organizationId: initialPrefill.organizationId || '',
      workshopRequestId: initialPrefill.workshopRequestId || '',
      songRequestId: initialPrefill.songRequestId || '',
      location: '',
      notes: '',
      calendarConnectionId: '',
    });
    setError(null);
    setModalOpen(true);
    setPrefillApplied(true);
  }, [initialPrefill, prefillApplied]);

  useEffect(() => {
    if (!selectedEventId || !detailOpen) return;
    const selected = appointments.find((item) => item.id === selectedEventId);
    if (!selected) return;
    const targetEvent = selected;

    let cancelled = false;
    async function loadDetails() {
      setDetailLoading(true);
      try {
        if (targetEvent.source === 'appointment' || !targetEvent.source) {
          const response = await fetch(`/api/crm/appointments/${targetEvent.id}`, { cache: 'no-store' });
          const data = await response.json().catch(() => null) as { item?: AppointmentDetail } | null;
          if (!cancelled) {
            setAppointmentDetail(data?.item || null);
            setWorkshopDetail(null);
          }
          return;
        }

        const workshopId = targetEvent.workshopRequestId;
        if (workshopId) {
          const response = await fetch(`/api/crm/workshop-requests/${workshopId}`, { cache: 'no-store' });
          const data = await response.json().catch(() => null) as { item?: WorkshopDetail } | null;
          if (!cancelled) {
            setWorkshopDetail(data?.item || null);
            setAppointmentDetail(null);
          }
          return;
        }

        if (!cancelled) {
          setAppointmentDetail(null);
          setWorkshopDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [appointments, detailOpen, selectedEventId]);

  useEffect(() => {
    if (!modalOpen && !detailOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [detailOpen, modalOpen]);

  function appointmentDurationText(startAt: string, endAt: string) {
    const durationMs = new Date(endAt).getTime() - new Date(startAt).getTime();
    const minutes = Math.max(0, Math.round(durationMs / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function buildOutlookHref(email: string) {
    return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
  }

  function buildTelHref(phone: string) {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  async function copySelectedInfo() {
    const selected = appointments.find((item) => item.id === selectedEventId);
    if (!selected) return;
    const lines = [
      `Titre: ${selected.title}`,
      `Debut: ${new Date(selected.startAt).toLocaleString('fr-CA')}`,
      `Fin: ${new Date(selected.endAt).toLocaleString('fr-CA')}`,
      `Type: ${toTypeLabel(selected.type)}`,
      `Statut: ${toStatusLabel(selected.status)}`,
      selected.location ? `Lieu: ${selected.location}` : null,
      selected.contactName ? `Contact: ${selected.contactName}` : null,
      selected.organizationName ? `Organisation: ${selected.organizationName}` : null,
    ].filter(Boolean).join('\n');

    await navigator.clipboard.writeText(lines);
  }

  function openCreateModal(startAt: string) {
    setDetailOpen(false);
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      startAt: toLocalInputValue(startAt),
      endAt: toLocalInputValue(defaultEnd(startAt)),
      type: 'MEETING',
      status: 'PENDING',
      contactId: '',
      organizationId: '',
      workshopRequestId: '',
      songRequestId: '',
      location: '',
      notes: '',
      calendarConnectionId: '',
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
      organizationId: item.organizationId || '',
      workshopRequestId: item.workshopRequestId || '',
      songRequestId: item.songRequestId || '',
      location: item.location || '',
      notes: item.notes || item.description || '',
      calendarConnectionId: item.calendarConnectionId || '',
    });
    setError(null);
    setDetailOpen(false);
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
      organizationId: form.organizationId,
      workshopRequestId: form.workshopRequestId,
      songRequestId: form.songRequestId,
      location: form.location,
      notes: form.notes,
      calendarConnectionId: form.calendarConnectionId,
    };

    try {
      const response = await fetch(editingId ? `/api/crm/appointments/${editingId}` : '/api/crm/appointments', {
        method: editingId ? 'PATCH' : 'POST',
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
        return [...next, {
          id: item.id,
          title: item.title,
          description: item.description,
          startAt: item.startAt,
          endAt: item.endAt,
          type: item.type,
          status: item.status,
          contactId: item.contactId,
          contactName,
          organizationId: item.organizationId || form.organizationId || null,
          workshopRequestId: item.workshopRequestId || form.workshopRequestId || null,
          songRequestId: item.songRequestId || form.songRequestId || null,
          location: item.location || form.location || null,
          notes: item.notes || form.notes || null,
          calendarConnectionId: item.calendarConnectionId || form.calendarConnectionId || null,
          meetingUrl: item.meetingUrl || null,
          organizationName: item.organizationName || organizations.find((entry) => entry.id === (item.organizationId || form.organizationId))?.label || null,
          workshopRequestTitle: item.workshopRequestTitle || workshopRequests.find((entry) => entry.id === (item.workshopRequestId || form.workshopRequestId))?.label || null,
          songRequestTitle: item.songRequestTitle || songRequests.find((entry) => entry.id === (item.songRequestId || form.songRequestId))?.label || null,
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

  async function deleteAppointment(targetId?: string) {
    const appointmentId = targetId || editingId;
    if (!appointmentId) return;
    if (!confirm('Annuler ce rendez-vous ?')) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/appointments/${appointmentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Suppression impossible');
      }
      const data = await response.json().catch(() => null) as { item?: CalendarEventItem } | null;
      if (data?.item) {
        setAppointments((current) => current.map((entry) => entry.id === appointmentId ? { ...entry, status: 'CANCELLED' } : entry));
      }
      setSelectedEventId((current) => (current === appointmentId ? appointmentId : current));
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function updateAppointmentStatus(nextStatus: 'CONFIRMED' | 'DONE' | 'CANCELLED') {
    const selected = appointments.find((item) => item.id === selectedEventId);
    if (!selected || (selected.source && selected.source !== 'appointment')) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/appointments/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          description: selected.description || '',
          startAt: selected.startAt,
          endAt: selected.endAt,
          type: selected.type,
          status: nextStatus,
          contactId: selected.contactId || '',
          organizationId: selected.organizationId || '',
          workshopRequestId: selected.workshopRequestId || '',
          songRequestId: selected.songRequestId || '',
          location: selected.location || '',
          notes: selected.notes || '',
          calendarConnectionId: selected.calendarConnectionId || '',
        }),
      });
      const data = await response.json().catch(() => null) as { item?: CalendarEventItem; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Mise a jour impossible');

      setAppointments((current) => current.map((entry) => entry.id === selected.id ? { ...entry, status: nextStatus } : entry));
      setAppointmentDetail((current) => current ? { ...current, status: nextStatus } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkshopQuick() {
    const selected = appointments.find((item) => item.id === selectedEventId);
    const workshopId = workshopDetail?.id || selected?.workshopRequestId;
    if (!workshopId || !workshopDetail) return;

    setWorkshopSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${workshopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: workshopDetail.status,
          contactPerson: workshopDetail.contactPerson,
          contactEmail: workshopDetail.contactEmail,
          contactPhone: workshopDetail.contactPhone,
          location: workshopDetail.location,
          startAt: workshopDetail.startAt,
          endAt: workshopDetail.endAt,
          durationMinutes: workshopDetail.durationMinutes,
          internalNotes: workshopDetail.internalNotes,
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string; item?: WorkshopDetail } | null;
      if (!response.ok) throw new Error(data?.error || 'Mise a jour atelier impossible');

      setAppointments((current) => current.map((entry) => {
        if (entry.workshopRequestId !== workshopId) return entry;
        return {
          ...entry,
          startAt: workshopDetail.startAt || entry.startAt,
          endAt: workshopDetail.endAt || entry.endAt,
          location: workshopDetail.location,
          status: workshopDetail.status,
        };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setWorkshopSaving(false);
    }
  }

  async function archiveWorkshopFromDetail() {
    const selected = appointments.find((item) => item.id === selectedEventId);
    const workshopId = workshopDetail?.id || selected?.workshopRequestId;
    if (!workshopId) return;
    if (!confirm('Archiver cet atelier ?')) return;

    setWorkshopSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${workshopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Archivage impossible');

      setAppointments((current) => current.map((entry) => entry.workshopRequestId === workshopId ? { ...entry, status: 'TERMINE' } : entry));
      setWorkshopDetail((current) => current ? { ...current, status: 'TERMINE' } : current);
      setDetailOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setWorkshopSaving(false);
    }
  }

  async function applyEventMove(change: EventChangeArg) {
    const current = appointments.find((entry) => entry.id === change.event.id);
    if (!current || !change.event.start || !change.event.end || (current.source && current.source !== 'appointment')) return;

    const payload = {
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
    };

    const response = await fetch(`/api/crm/appointments/${current.id}`, {
      method: 'PATCH',
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
              <option value="appointment">CRM interne</option>
              <option value="google_calendar">Google</option>
              <option value="microsoft_calendar">Microsoft</option>
              <option value="calendly">Calendly</option>
              <option value="workshop_appointment">Ateliers</option>
              <option value="workshop_availability">Disponibilités atelier</option>
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
            <p className="text-xs text-slate-500">Résultats</p>
            <p className="mt-2 text-2xl font-semibold text-white">{filteredAppointments.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Événement sélectionné</p>
            {selectedEvent ? (
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p className="font-medium text-white">{selectedEvent.title}</p>
                <p>{selectedEvent.organizationName || selectedEvent.contactName || 'Sans contact'}</p>
                {selectedEvent.workshopRequestTitle ? <p className="text-xs text-slate-500">Atelier: {selectedEvent.workshopRequestTitle}</p> : null}
                {selectedEvent.songRequestTitle ? <p className="text-xs text-slate-500">Chanson: {selectedEvent.songRequestTitle}</p> : null}
                <p>{toStatusLabel(selectedEvent.status)} · {toTypeLabel(selectedEvent.type)}</p>
                {selectedEvent.meetingUrl ? <a href={selectedEvent.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex text-xs text-primary-300 hover:text-primary-200">Ouvrir le lien de réunion</a> : null}
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.source === 'appointment' || !selectedEvent.source ? <button onClick={() => openEditModal(selectedEvent)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Modifier</button> : null}
                  <button onClick={() => setDetailOpen(true)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Voir toutes les actions</button>
                  {selectedEvent.contactId ? <Link href={`/crm/contacts/${selectedEvent.contactId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Fiche contact</Link> : null}
                  {selectedEvent.organizationId ? <Link href={`/crm/organizations/${selectedEvent.organizationId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Fiche organisation</Link> : null}
                  {selectedEvent.workshopRequestId ? <Link href={`/crm/workshop-requests/${selectedEvent.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Fiche atelier</Link> : null}
                  {selectedEvent.songRequestId ? <Link href={`/crm/song-requests/${selectedEvent.songRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Demande chanson</Link> : null}
                </div>
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
              setDetailOpen(true);
            }}
            eventDrop={applyEventMove}
            eventResize={applyEventMove}
          />
        </div>
      </div>

      {detailOpen && selectedEvent ? (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <button type="button" aria-label="Fermer le détail" className="absolute inset-0" onClick={() => setDetailOpen(false)} />
          <div
            className="relative z-10 w-full rounded-t-[1.6rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl shadow-black/40 sm:max-w-3xl sm:rounded-[1.6rem] sm:p-6"
            style={{ maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Détail calendrier</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedEvent.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{toStatusLabel(selectedEvent.status)} · {toTypeLabel(selectedEvent.type)}</p>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white">Fermer</button>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200 sm:grid-cols-2">
              <p><span className="text-slate-500">Date:</span> {new Date(selectedEvent.startAt).toLocaleDateString('fr-CA')}</p>
              <p><span className="text-slate-500">Heure:</span> {new Date(selectedEvent.startAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEvent.endAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><span className="text-slate-500">Durée:</span> {appointmentDurationText(selectedEvent.startAt, selectedEvent.endAt)}</p>
              <p><span className="text-slate-500">Lieu:</span> {selectedEvent.location || appointmentDetail?.location || workshopDetail?.location || '—'}</p>
              <p><span className="text-slate-500">Contact:</span> {appointmentDetail?.contact?.fullName || workshopDetail?.contact?.fullName || workshopDetail?.client?.fullName || selectedEvent.contactName || '—'}</p>
              <p><span className="text-slate-500">Organisation:</span> {appointmentDetail?.organization?.name || workshopDetail?.organization?.name || selectedEvent.organizationName || '—'}</p>
              {selectedEvent.workshopRequestId ? <p><span className="text-slate-500">Atelier lié:</span> {selectedEvent.workshopRequestTitle || workshopDetail?.title || selectedEvent.workshopRequestId}</p> : null}
              {selectedEvent.songRequestId ? <p><span className="text-slate-500">Demande chanson:</span> {selectedEvent.songRequestTitle || selectedEvent.songRequestId}</p> : null}
              {appointmentDetail?.createdAt ? <p><span className="text-slate-500">Créé le:</span> {new Date(appointmentDetail.createdAt).toLocaleString('fr-CA')}</p> : null}
              {appointmentDetail?.updatedAt ? <p><span className="text-slate-500">Modifié le:</span> {new Date(appointmentDetail.updatedAt).toLocaleString('fr-CA')}</p> : null}
              {selectedEvent.notes || appointmentDetail?.notes || workshopDetail?.internalNotes ? <p className="sm:col-span-2"><span className="text-slate-500">Notes:</span> {selectedEvent.notes || appointmentDetail?.notes || workshopDetail?.internalNotes}</p> : null}
            </div>

            {detailLoading ? <p className="mt-3 text-sm text-slate-400">Chargement du détail...</p> : null}

            {(selectedEvent.source === 'appointment' || !selectedEvent.source) ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Actions rendez-vous</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => openEditModal(selectedEvent)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white">Modifier</button>
                  <button type="button" onClick={() => void updateAppointmentStatus('CONFIRMED')} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Marquer confirmé</button>
                  <button type="button" onClick={() => void updateAppointmentStatus('DONE')} disabled={saving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Marquer terminé</button>
                  <button type="button" onClick={() => void updateAppointmentStatus('CANCELLED')} disabled={saving} className="rounded-xl border border-red-800/60 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">Marquer annulé</button>
                  <button type="button" onClick={() => void deleteAppointment(selectedEvent.id)} disabled={saving} className="rounded-xl border border-red-800/60 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">Supprimer / Annuler</button>
                  <button type="button" onClick={() => void copySelectedInfo()} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white">Copier les infos</button>
                </div>
              </div>
            ) : null}

            {(selectedEvent.source === 'workshop_appointment' || selectedEvent.workshopRequestId) ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Actions atelier</p>
                {workshopDetail ? (
                  <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-xs text-slate-400">Début</span>
                      <input type="datetime-local" value={workshopDetail.startAt ? toLocalInputValue(workshopDetail.startAt) : ''} onChange={(event) => setWorkshopDetail((current) => current ? { ...current, startAt: event.target.value ? fromLocalInputValue(event.target.value) : null } : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs text-slate-400">Fin</span>
                      <input type="datetime-local" value={workshopDetail.endAt ? toLocalInputValue(workshopDetail.endAt) : ''} onChange={(event) => setWorkshopDetail((current) => current ? { ...current, endAt: event.target.value ? fromLocalInputValue(event.target.value) : null } : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs text-slate-400">Lieu</span>
                      <input value={workshopDetail.location || ''} onChange={(event) => setWorkshopDetail((current) => current ? { ...current, location: event.target.value } : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs text-slate-400">Statut</span>
                      <select value={workshopDetail.status} onChange={(event) => setWorkshopDetail((current) => current ? { ...current, status: event.target.value } : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                        {['EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE'].map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="sm:col-span-2">
                      <span className="mb-1 block text-xs text-slate-400">Notes internes</span>
                      <textarea rows={3} value={workshopDetail.internalNotes || ''} onChange={(event) => setWorkshopDetail((current) => current ? { ...current, internalNotes: event.target.value } : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </label>
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-3">
                  {selectedEvent.workshopRequestId ? <Link href={`/crm/workshop-requests/${selectedEvent.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir fiche atelier</Link> : null}
                  {selectedEvent.workshopRequestId ? <Link href={`/crm/invoices?workshopId=${selectedEvent.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Créer facture</Link> : null}
                  {selectedEvent.workshopRequestId ? <Link href={`/crm/submissions?workshopId=${selectedEvent.workshopRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Créer soumission</Link> : null}
                  <button type="button" onClick={() => void saveWorkshopQuick()} disabled={workshopSaving} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white disabled:opacity-60">Modifier l'atelier</button>
                  <button type="button" onClick={() => void archiveWorkshopFromDetail()} disabled={workshopSaving} className="rounded-xl border border-red-800/60 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">Archiver l'atelier</button>
                  <button type="button" onClick={() => void copySelectedInfo()} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:text-white">Copier les infos</button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {appointmentDetail?.contact?.id || workshopDetail?.contact?.id ? <Link href={`/crm/contacts/${appointmentDetail?.contact?.id || workshopDetail?.contact?.id}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir fiche contact</Link> : null}
              {(appointmentDetail?.organization?.id || workshopDetail?.organization?.id) ? <Link href={`/crm/organizations/${appointmentDetail?.organization?.id || workshopDetail?.organization?.id}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir fiche organisation</Link> : null}
              {selectedEvent.songRequestId ? <Link href={`/crm/song-requests/${selectedEvent.songRequestId}`} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Ouvrir demande chanson</Link> : null}
              {appointmentDetail?.contact?.email || workshopDetail?.contactEmail ? <a href={buildOutlookHref(appointmentDetail?.contact?.email || workshopDetail?.contactEmail || '')} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Envoyer un courriel</a> : null}
              {appointmentDetail?.contact?.phone || workshopDetail?.contactPhone ? <a href={buildTelHref(appointmentDetail?.contact?.phone || workshopDetail?.contactPhone || '')} className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:text-white">Appeler le contact</a> : null}
            </div>

            <div className="pb-[calc(96px+env(safe-area-inset-bottom))]" />
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-2xl rounded-t-[2rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl shadow-black/30 sm:rounded-[2rem] sm:p-6" style={{ maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                  {Object.keys(TYPE_COLORS).map((key) => <option key={key} value={key}>{toTypeLabel(key)}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Statut</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'].map((key) => <option key={key} value={key}>{toStatusLabel(key)}</option>)}
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
                <span className="mb-2 block text-sm text-slate-300">Organisation</span>
                <select value={form.organizationId} onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Aucune</option>
                  {organizations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Lier a un atelier</span>
                <select value={form.workshopRequestId} onChange={(event) => {
                  const workshopId = event.target.value;
                  const linkedWorkshop = workshopRequests.find((item) => item.id === workshopId);
                  setForm((current) => ({
                    ...current,
                    workshopRequestId: workshopId,
                    type: workshopId ? 'WORKSHOP' : current.type,
                    contactId: workshopId && linkedWorkshop?.contactId ? linkedWorkshop.contactId : current.contactId,
                    organizationId: workshopId && linkedWorkshop?.organizationId ? linkedWorkshop.organizationId : current.organizationId,
                  }));
                }} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Aucun atelier</option>
                  {workshopRequests.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Lier a une demande chanson</span>
                <select value={form.songRequestId} onChange={(event) => {
                  const songId = event.target.value;
                  const linkedSong = songRequests.find((item) => item.id === songId);
                  setForm((current) => ({
                    ...current,
                    songRequestId: songId,
                    type: songId ? 'SONG_MEETING' : current.type,
                    contactId: songId && linkedSong?.contactId ? linkedSong.contactId : current.contactId,
                    organizationId: songId && linkedSong?.organizationId ? linkedSong.organizationId : current.organizationId,
                  }));
                }} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Aucune demande</option>
                  {songRequests.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Lieu</span>
                <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Ajouter au calendrier connecté</span>
                <select value={form.calendarConnectionId} onChange={(event) => setForm((current) => ({ ...current, calendarConnectionId: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Calendrier interne seulement</option>
                  {calendarConnections.filter((item) => item.provider !== 'CALENDLY').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Description</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Notes</span>
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                {editingId ? (
                  <button onClick={() => void deleteAppointment()} disabled={saving} className="rounded-2xl border border-red-800/60 px-4 py-2.5 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60">
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