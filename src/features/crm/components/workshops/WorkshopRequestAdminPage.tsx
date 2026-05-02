'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';
import { AppointmentSelector } from '@/features/crm/components/appointments/AppointmentSelector';

type WorkshopPageProps = {
  item: {
    id: string;
    title: string;
    status: string;
    workshopType: string;
    workshopTheme: string;
    organizationId: string | null;
    organizationName: string | null;
    contactId: string | null;
    clientId: string | null;
    organizationContactId: string | null;
    contactPerson: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    addressOrLocation: string | null;
    location: string | null;
    estimatedParticipants: number | null;
    participantEstimate: number | null;
    finalPrice: string | null;
    requestedDate: string | null;
    requestedTime: string | null;
    scheduledAt: string | null;
    startAt: string | null;
    endAt: string | null;
    durationMinutes: number | null;
    meetingType: string | null;
    durationPreset: string;
    objectives: string;
    notes: string | null;
    internalNotes: string | null;
    organization: { id: string; name: string } | null;
    contact: { id: string; fullName: string } | null;
    client: { id: string; fullName: string } | null;
    organizationContact: { id: string; contactId: string | null; fullName: string } | null;
    appointments: Array<{ id: string; title: string; startAt: string; endAt: string; status: string; location: string | null }>;
    crmAppointments: Array<{ id: string; title: string; startAt: string; endAt: string; status: string; type: string; location: string | null }>;
  };
  calendarConnections: Array<{ id: string; provider: string; accountName: string | null; accountEmail: string | null; status: string }>;
  isAdmin?: boolean;
};

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

function buildOutlookHref(email: string) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
}

function buildTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

const DELETABLE_STATUSES = ['ANNULE', 'DELETED', 'CANCELLED', 'TERMINE', 'COMPLETED'];

export function WorkshopRequestAdminPage({ item, calendarConnections, isAdmin = false }: WorkshopPageProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirm2, setDeleteConfirm2] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    title: item.title,
    workshopType: item.workshopType,
    organizationId: item.organizationId || '',
    contactId: item.contactId || '',
    clientId: item.clientId || '',
    organizationContactId: item.organizationContactId || '',
    organizationName: item.organizationName || item.organization?.name || '',
    contactPerson: item.contactPerson || item.organizationContact?.fullName || item.contact?.fullName || item.client?.fullName || '',
    contactEmail: item.contactEmail || '',
    contactPhone: item.contactPhone || '',
    addressOrLocation: item.addressOrLocation || item.location || '',
    deliveryFormat: 'SUR_PLACE',
    participantEstimate: String(item.participantEstimate || item.estimatedParticipants || 0),
    targetAudience: 'AUTRE',
    durationPreset: item.durationPreset || 'M90',
    pricingMode: 'HORAIRE',
    basePrice: item.finalPrice || '',
    discountPercent: '0',
    internalNotes: item.internalNotes || '',
    clientNotes: '',
    audienceType: 'MIXED',
    ageRange: '',
    estimatedParticipants: String(item.estimatedParticipants || item.participantEstimate || 0),
    requestedDate: toDateInput(item.requestedDate),
    requestedTime: item.requestedTime || '',
    preferredDays: [] as string[],
    format: 'IN_PERSON',
    location: item.location || item.addressOrLocation || '',
    workshopTheme: item.workshopTheme,
    objectives: item.objectives,
    notes: item.notes || '',
    status: item.status,
  });
  const [schedule, setSchedule] = useState({
    date: toDateInput(item.scheduledAt || item.startAt || item.requestedDate),
    startTime: item.startAt ? item.startAt.slice(11, 16) : '09:00',
    endTime: item.endAt ? item.endAt.slice(11, 16) : '10:00',
    durationMinutes: String(item.durationMinutes || 60),
    meetingType: item.meetingType || 'en_personne',
    location: item.location || item.addressOrLocation || '',
    calendarConnectionId: '',
    linkedAppointmentId: '',
  });

  async function saveWorkshop() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          participantEstimate: Number(form.participantEstimate || 0),
          estimatedParticipants: Number(form.estimatedParticipants || 0),
          basePrice: Number(form.basePrice || 0),
          discountPercent: Number(form.discountPercent || 0),
          requestedDate: form.requestedDate || undefined,
          scheduledAt: schedule.date ? new Date(`${schedule.date}T${schedule.startTime}:00`).toISOString() : undefined,
          startAt: schedule.date ? new Date(`${schedule.date}T${schedule.startTime}:00`).toISOString() : undefined,
          endAt: schedule.date ? new Date(`${schedule.date}T${schedule.endTime}:00`).toISOString() : undefined,
          durationMinutes: Number(schedule.durationMinutes || 0) || undefined,
          meetingType: schedule.meetingType,
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Modification impossible');
      setMessage('Demande d\'atelier modifiée par l\'admin.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Modification impossible');
    } finally {
      setSaving(false);
    }
  }

  async function scheduleWorkshop() {
    if (!schedule.date) {
      setMessage('Choisis une date pour planifier.');
      return;
    }

    setScheduling(true);
    setMessage(null);
    try {
      const startAt = new Date(`${schedule.date}T${schedule.startTime}:00`);
      const endAt = new Date(`${schedule.date}T${schedule.endTime}:00`);
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Atelier - ${form.title}`,
          description: form.workshopTheme,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          location: schedule.location,
          durationMinutes: Number(schedule.durationMinutes || 0) || undefined,
          meetingType: schedule.meetingType,
          calendarConnectionId: schedule.calendarConnectionId || undefined,
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string; warning?: string | null } | null;
      if (!response.ok) throw new Error(data?.error || 'Planification impossible');
      setMessage(data?.warning ? `Horaire créé, mais sync externe partielle: ${data.warning}` : 'Horaire d’atelier confirmé.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Planification impossible');
    } finally {
      setScheduling(false);
    }
  }

  async function linkExistingAppointment(appointmentId: string) {
    if (!appointmentId) {
      setMessage('Saisir un identifiant de rendez-vous.');
      return;
    }

    setScheduling(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link_existing', appointmentId }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Liaison impossible');
      setSchedule((current) => ({ ...current, linkedAppointmentId: '' }));
      setMessage('Rendez-vous lié à l’atelier.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Liaison impossible');
    } finally {
      setScheduling(false);
    }
  }

  async function unlinkCrmAppointment(appointmentId: string) {
    setScheduling(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink', appointmentId }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Déliaison impossible');
      setMessage('Rendez-vous délié.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Déliaison impossible');
    } finally {
      setScheduling(false);
    }
  }

  async function cancelWorkshopAppt(waId: string) {
    setActionLoading((current) => ({ ...current, [waId]: true }));
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_workshop_appointment', workshopAppointmentId: waId }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Annulation impossible');
      setMessage('Horaire annulé.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Annulation impossible');
    } finally {
      setActionLoading((current) => ({ ...current, [waId]: false }));
    }
  }

  async function deleteWorkshopAppt(waId: string) {
    if (!window.confirm('Supprimer définitivement cet horaire\u00a0? Cette action est irréversible.')) return;
    setActionLoading((current) => ({ ...current, [waId]: true }));
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_workshop_appointment', workshopAppointmentId: waId }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Suppression impossible');
      setMessage('Horaire supprimé définitivement.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Suppression impossible');
    } finally {
      setActionLoading((current) => ({ ...current, [waId]: false }));
    }
  }

  async function cancelCrmAppt(appointmentId: string) {
    setActionLoading((current) => ({ ...current, [appointmentId]: true }));
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', appointmentId }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Annulation impossible');
      setMessage('Rendez-vous annulé.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Annulation impossible');
    } finally {
      setActionLoading((current) => ({ ...current, [appointmentId]: false }));
    }
  }

  async function removeWorkshopFromCalendar() {
    if (!window.confirm('Retirer cet atelier du calendrier CRM ? Les horaires liés seront nettoyés.')) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/crm/calendar/remove-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'workshop', sourceId: item.id }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Retrait du calendrier impossible');
      setMessage('Atelier retiré du calendrier.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Retrait du calendrier impossible');
    } finally {
      setSaving(false);
    }
  }

  async function removeAppointmentFromCalendar(appointmentId: string) {
    setActionLoading((current) => ({ ...current, [appointmentId]: true }));
    setMessage(null);
    try {
      const response = await fetch('/api/crm/calendar/remove-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'appointment', sourceId: appointmentId }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Retrait du calendrier impossible');
      setMessage('Rendez-vous retiré du calendrier.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Retrait du calendrier impossible');
    } finally {
      setActionLoading((current) => ({ ...current, [appointmentId]: false }));
    }
  }

  async function permanentDelete() {
    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/workshop-requests/${item.id}/permanent`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => null) as { error?: string; deletedTitle?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Suppression impossible');
      router.push('/crm/workshop-requests');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Suppression impossible');
      setDeleting(false);
      setConfirmDelete(false);
      setDeleteConfirm2(false);
    }
  }

  const responsibleHref = item.organizationContact?.contactId || item.contact?.id || item.client?.id;
  const invoiceHref = (item.contactId || item.clientId)
    ? `/crm/invoices?contactId=${item.contactId || item.clientId}&workshopId=${item.id}&description=${encodeURIComponent(`Atelier - ${form.title}`)}&amount=${encodeURIComponent(item.finalPrice || '')}`
    : '/crm/invoices';

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/crm/calendar" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Calendrier
              </Link>
              <span className="text-slate-600">·</span>
              <Link href="/crm/workshop-requests" className="text-sm text-slate-400 hover:text-white">Tous les ateliers</Link>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white">{item.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge value={item.status} />
              <StatusBadge value={item.workshopType} />
            </div>
            <p className="mt-4 max-w-3xl text-sm text-slate-300">Fiche d’action atelier pour modifier rapidement les informations, planifier un horaire, préparer la facture et communiquer avec le responsable.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
            <button type="button" onClick={() => void saveWorkshop()} disabled={saving} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white disabled:opacity-60">{saving ? 'Enregistrement...' : 'Modifier l’atelier'}</button>
            <Link href={invoiceHref} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Créer une facture</Link>
            <Link href={`/crm/commercial-quotes/new?workshopRequestId=${item.id}`} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Créer une soumission</Link>
            <button type="button" onClick={() => void scheduleWorkshop()} disabled={scheduling} className="rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-left text-sm text-slate-200 hover:border-primary-500/40 hover:text-white disabled:opacity-60">{scheduling ? 'Planification...' : 'Planifier un horaire'}</button>
          </div>
        </div>
        {message ? <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">Informations de l’atelier</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Titre</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Statut</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="EN_ATTENTE_RDV">En attente RDV</option><option value="RDV_PLANIFIE">RDV planifié</option><option value="CONFIRME">Confirmé</option><option value="TERMINE">Terminé</option><option value="ANNULE">Annulé</option><option value="BROUILLON">Brouillon</option></select></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Organisation</span><input value={form.organizationName} onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Responsable</span><input value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Courriel</span><input value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Téléphone</span><input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Date souhaitée</span><input type="date" value={form.requestedDate} onChange={(event) => setForm((current) => ({ ...current, requestedDate: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Horaire souhaité</span><input value={form.requestedTime} onChange={(event) => setForm((current) => ({ ...current, requestedTime: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Lieu</span><input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value, addressOrLocation: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Participants</span><input type="number" value={form.estimatedParticipants} onChange={(event) => setForm((current) => ({ ...current, estimatedParticipants: event.target.value, participantEstimate: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Prix</span><input type="number" step="0.01" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Thème</span><input value={form.workshopTheme} onChange={(event) => setForm((current) => ({ ...current, workshopTheme: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Objectifs</span><textarea value={form.objectives} onChange={(event) => setForm((current) => ({ ...current, objectives: event.target.value }))} className="min-h-[100px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Notes internes</span><textarea value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} className="min-h-[100px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Planification de l’atelier</h2>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.appointments.length}</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Date</span><input type="date" value={schedule.date} onChange={(event) => setSchedule((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Début</span><input type="time" value={schedule.startTime} onChange={(event) => setSchedule((current) => ({ ...current, startTime: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Fin</span><input type="time" value={schedule.endTime} onChange={(event) => setSchedule((current) => ({ ...current, endTime: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Durée</span><input type="number" min={1} max={1440} value={schedule.durationMinutes} onChange={(event) => setSchedule((current) => ({ ...current, durationMinutes: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Type</span><select value={schedule.meetingType} onChange={(event) => setSchedule((current) => ({ ...current, meetingType: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="en_personne">En personne</option><option value="telephone">Téléphone</option><option value="visio">Visio</option><option value="autre">Autre</option></select></label>
              <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Calendrier connecté</span><select value={schedule.calendarConnectionId} onChange={(event) => setSchedule((current) => ({ ...current, calendarConnectionId: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="">CRM seulement</option>{calendarConnections.filter((connection) => connection.status !== 'DISCONNECTED').map((connection) => <option key={connection.id} value={connection.id}>{connection.provider} · {connection.accountName || connection.accountEmail || connection.id}</option>)}</select></label>
              <label className="md:col-span-2 xl:col-span-4"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Lieu</span><input value={schedule.location} onChange={(event) => setSchedule((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void saveWorkshop()} disabled={saving} className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white disabled:opacity-60">{saving ? 'Enregistrement...' : 'Enregistrer l’horaire'}</button>
              <button type="button" onClick={() => void removeWorkshopFromCalendar()} disabled={saving} className="rounded-md border border-red-700/60 px-3 py-2 text-xs text-red-300 hover:bg-red-900/30 hover:text-red-200 disabled:opacity-60">Retirer cet atelier du calendrier</button>
            </div>
            <div className="mt-5 space-y-3">
              {item.appointments.length === 0 ? <p className="text-sm text-slate-400">Aucun horaire planifié.</p> : (() => {
                const startTimes = item.appointments.map((a) => a.startAt.slice(0, 16));
                return item.appointments.map((appointment) => {
                  const isDuplicate = startTimes.filter((t) => t === appointment.startAt.slice(0, 16)).length > 1;
                  const loading = actionLoading[appointment.id] ?? false;
                  return (
                    <article key={appointment.id} className={`rounded-xl border p-4 text-sm text-slate-200 ${isDuplicate ? 'border-amber-600/50 bg-amber-950/20' : 'border-slate-800 bg-slate-950/50'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-medium text-white">{appointment.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {isDuplicate && <span className="rounded-full border border-amber-600/60 px-2 py-0.5 text-xs text-amber-400">Doublon possible</span>}
                          <StatusBadge value={appointment.status} />
                        </div>
                      </div>
                      <p className="mt-2 text-slate-400">{new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(appointment.startAt))}</p>
                      {appointment.location ? <p className="mt-1 text-slate-500">{appointment.location}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {appointment.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => void cancelWorkshopAppt(appointment.id)}
                            disabled={loading}
                            className="rounded-md border border-amber-700/60 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-900/30 hover:text-amber-200 disabled:opacity-50"
                          >
                            {loading ? 'En cours…' : 'Annuler cet horaire'}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => void deleteWorkshopAppt(appointment.id)}
                            disabled={loading}
                            className="rounded-md border border-red-700/60 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50"
                          >
                            {loading ? 'En cours…' : 'Supprimer définitivement'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                });
              })()}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Rendez-vous liés</h2>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.crmAppointments.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {item.crmAppointments.length === 0 ? <p className="text-sm text-slate-400">Aucun rendez-vous CRM lié.</p> : item.crmAppointments.map((appointment) => (
                <article key={appointment.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{appointment.title}</p>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <p className="mt-2 text-slate-400">{new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(appointment.startAt))}</p>
                  <p className="mt-1 text-slate-500">{appointment.type}{appointment.location ? ` · ${appointment.location}` : ''}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {appointment.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => void cancelCrmAppt(appointment.id)}
                        disabled={actionLoading[appointment.id] ?? false}
                        className="rounded-md border border-amber-700/60 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-900/30 hover:text-amber-200 disabled:opacity-50"
                      >
                        {(actionLoading[appointment.id] ?? false) ? 'En cours…' : 'Annuler'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void unlinkCrmAppointment(appointment.id)}
                      disabled={scheduling || (actionLoading[appointment.id] ?? false)}
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-50"
                    >
                      Délier de l’atelier
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeAppointmentFromCalendar(appointment.id)}
                      disabled={actionLoading[appointment.id] ?? false}
                      className="rounded-md border border-red-700/60 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/30 hover:text-red-200 disabled:opacity-50"
                    >
                      Retirer du calendrier
                    </button>
                    <Link href={`/crm/appointments/${appointment.id}`} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white">
                      Ouvrir
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <AppointmentSelector
                onSelect={linkExistingAppointment}
                loading={scheduling}
                contactId={item.contactId}
                organizationId={item.organizationId}
                onlyUnlinked={true}
                excludeTypes={[]}
                label="Lier un rendez-vous existant"
                placeholder="Chercher par titre, contact, date..."
              />
              <button type="button" onClick={() => void scheduleWorkshop()} disabled={scheduling} className="rounded-md border border-primary-500/40 px-3 py-2 text-xs text-primary-200 hover:text-white disabled:opacity-60">Créer un rendez-vous lié</button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">Responsable</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Nom</p>
                {responsibleHref ? <Link href={`/crm/contacts/${responsibleHref}`} className="mt-1 inline-block text-primary-200 hover:text-white">{form.contactPerson || 'Responsable'}</Link> : <p className="mt-1 text-white">{form.contactPerson || '—'}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Courriel</p>
                {form.contactEmail ? <a href={buildOutlookHref(form.contactEmail)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-primary-200 hover:text-white">{form.contactEmail}</a> : <p className="mt-1 text-white">—</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Téléphone</p>
                {form.contactPhone ? <a href={buildTelHref(form.contactPhone)} className="mt-1 inline-block text-primary-200 hover:text-white">{form.contactPhone}</a> : <p className="mt-1 text-white">—</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {form.contactEmail ? <a href={buildOutlookHref(form.contactEmail)} target="_blank" rel="noreferrer" className="rounded-md border border-primary-500/40 px-3 py-2 text-xs text-primary-200 hover:text-white">Envoyer un courriel</a> : null}
              {form.contactPhone ? <a href={buildTelHref(form.contactPhone)} className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white">Appeler</a> : null}
              {(form.contactEmail || form.contactPhone) ? <button type="button" onClick={() => void navigator.clipboard.writeText([form.contactPerson, form.contactEmail, form.contactPhone].filter(Boolean).join(' · '))} className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white">Copier les coordonnées</button> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">Repères rapides</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">Organisation : {item.organization?.id ? <Link href={`/crm/organizations/${item.organization.id}`} className="text-primary-200 hover:text-white">{item.organization.name}</Link> : (form.organizationName || '—')}</div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">Prix prévu : {item.finalPrice ? `${item.finalPrice} $` : '—'}</div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">Lieu : {form.location || form.addressOrLocation || '—'}</div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">Participants : {form.estimatedParticipants || '—'}</div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-5 py-4 text-sm text-slate-400">
            Les soumissions commerciales utilisent maintenant un module dédié (devis CRM), distinct des soumissions entrantes du site.
          </section>
          {isAdmin && DELETABLE_STATUSES.includes(item.status) && (
            <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-5">
              <h2 className="text-base font-semibold text-red-400">Zone de danger — Admin</h2>
              {!confirmDelete && (
                <div className="mt-4">
                  <p className="text-sm text-slate-400">Cette action supprimera définitivement l'atelier, tous ses rendez-vous d'horaire, et les liens vers les rendez-vous CRM. Cette opération est irréversible.</p>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(true); setDeleteConfirm2(false); }}
                    className="mt-4 rounded-md border border-red-700/60 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300"
                  >
                    Supprimer définitivement…
                  </button>
                </div>
              )}
              {confirmDelete && !deleteConfirm2 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-red-300">Êtes-vous sûr(e) ? Cette action est irréversible. L'atelier «&nbsp;{item.title}&nbsp;» sera supprimé définitivement.</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm2(true)}
                      className="rounded-md bg-red-800/40 border border-red-700/60 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-800/70"
                    >
                      Confirmer — je veux supprimer définitivement
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirmDelete(false); setDeleteConfirm2(false); }}
                      className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              {confirmDelete && deleteConfirm2 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-red-200">Dernière confirmation requise.</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void permanentDelete()}
                      disabled={deleting}
                      className="rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      {deleting ? 'Suppression en cours…' : 'Oui, supprimer définitivement'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirmDelete(false); setDeleteConfirm2(false); }}
                      disabled={deleting}
                      className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-60"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}        </div>
      </div>
    </section>
  );
}