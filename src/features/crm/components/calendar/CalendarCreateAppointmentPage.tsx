'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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

const TYPE_OPTIONS = [
  { value: 'MEETING', label: 'Rendez-vous' },
  { value: 'WORKSHOP', label: 'Atelier' },
  { value: 'CALL', label: 'Appel' },
  { value: 'OTHER', label: 'Autre' },
] as const;

function localDateInputFromParam(dateParam?: string) {
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return new Date().toISOString().slice(0, 10);
  }
  return dateParam;
}

function toIsoDateTime(dateValue: string, timeValue: string) {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

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
  organizations,
  workshopRequests,
  songRequests,
  calendarConnections,
}: {
  initialDate?: string;
  contacts: ContactOption[];
  organizations: OrganizationOption[];
  workshopRequests: RequestOption[];
  songRequests: RequestOption[];
  calendarConnections: ConnectionOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'MEETING',
    status: 'PENDING',
    date: localDateInputFromParam(initialDate),
    startTime: '09:00',
    durationMinutes: '60',
    contactId: '',
    organizationId: '',
    workshopRequestId: '',
    songRequestId: '',
    location: '',
    notes: '',
    description: '',
    calendarConnectionId: '',
  });

  const selectedContact = useMemo(
    () => contacts.find((item) => item.id === form.contactId),
    [contacts, form.contactId],
  );

  const calendlyBaseUrl = process.env.NEXT_PUBLIC_CALENDLY_EVENT_URL;
  const calendlyLink = useMemo(() => {
    if (!calendlyBaseUrl) return null;
    const startIso = toIsoDateTime(form.date, form.startTime);
    return buildCalendlyLink(calendlyBaseUrl, startIso, selectedContact);
  }, [calendlyBaseUrl, form.date, form.startTime, selectedContact]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    const duration = Number.parseInt(form.durationMinutes, 10);
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      setError('La duree doit etre comprise entre 15 et 480 minutes.');
      return;
    }

    const startDate = new Date(`${form.date}T${form.startTime}:00`);
    if (Number.isNaN(startDate.getTime())) {
      setError('La date ou l heure de debut est invalide.');
      return;
    }

    const endDate = new Date(startDate.getTime() + duration * 60_000);

    setSaving(true);
    try {
      const response = await fetch('/api/crm/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          status: form.status,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          contactId: form.contactId,
          organizationId: form.organizationId,
          workshopRequestId: form.workshopRequestId,
          songRequestId: form.songRequestId,
          location: form.location,
          notes: form.notes,
          description: form.description,
          calendarConnectionId: form.calendarConnectionId,
        }),
      });

      const data = (await response.json().catch(() => null)) as { item?: { id: string }; error?: string } | null;
      if (!response.ok || !data?.item) {
        throw new Error(data?.error || 'Creation impossible');
      }

      setSuccess('Rendez-vous cree. Redirection en cours...');
      router.push(`/crm/appointments/${data.item.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Calendrier</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Nouveau rendez-vous</h2>
          <p className="mt-2 text-sm text-slate-400">
            Creation sur page dediee. Depuis le calendrier, un clic sur une date vide arrive ici.
          </p>
        </div>
        <Link
          href="/crm/calendar"
          className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white"
        >
          Retour calendrier
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="crm-surface space-y-5 p-5 lg:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Titre</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              placeholder="Ex: Rendez-vous de cadrage"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Type</span>
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              {TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Statut</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirme</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Heure de debut</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Duree (minutes)</span>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={form.durationMinutes}
              onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Client relie</span>
            <select
              value={form.contactId}
              onChange={(event) => setForm((current) => ({ ...current, contactId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              <option value="">Aucun</option>
              {contacts.map((item) => (
                <option key={item.id} value={item.id}>{item.fullName}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Organisation</span>
            <select
              value={form.organizationId}
              onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              <option value="">Aucune</option>
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Lier a un atelier</span>
            <select
              value={form.workshopRequestId}
              onChange={(event) => setForm((current) => ({ ...current, workshopRequestId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              <option value="">Aucun atelier</option>
              {workshopRequests.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Lier a une demande chanson</span>
            <select
              value={form.songRequestId}
              onChange={(event) => setForm((current) => ({ ...current, songRequestId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              <option value="">Aucune demande</option>
              {songRequests.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Calendrier connecte</span>
            <select
              value={form.calendarConnectionId}
              onChange={(event) => setForm((current) => ({ ...current, calendarConnectionId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            >
              <option value="">Calendrier interne seulement</option>
              {calendarConnections.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Lieu</span>
            <input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              placeholder="Ex: Visioconference, bureau client, etc."
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Notes internes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Calendly</p>
          {calendlyLink ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={calendlyLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-primary-600/60 bg-primary-950/35 px-4 py-2 text-sm text-primary-200 hover:bg-primary-900/45 hover:text-white"
              >
                Ouvrir Calendly
              </a>
              <p className="text-xs text-slate-400">Le lien reprend la date/heure choisie et le contact si disponible.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-300">
              Lien Calendly non configure. Ajoute NEXT_PUBLIC_CALENDLY_EVENT_URL dans Vercel.
            </p>
          )}
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/crm/calendar"
            className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60"
          >
            {saving ? 'Creation...' : 'Creer le rendez-vous'}
          </button>
        </div>
      </form>
    </section>
  );
}
