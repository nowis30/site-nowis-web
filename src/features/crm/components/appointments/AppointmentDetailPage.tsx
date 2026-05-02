'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  DONE: 'Terminé',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  CONFIRMED: 'bg-green-500/15 text-green-300 border-green-500/30',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/30',
  DONE: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startIso: string, endIso: string) {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}

type OptionItem = { id: string; label: string };
type LinkedItem = { id: string; label: string; contactId: string | null; organizationId: string | null };

type AppointmentItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: string;
  status: string;
  location: string | null;
  notes: string | null;
  meetingUrl: string | null;
  contactId: string | null;
  organizationId: string | null;
  workshopRequestId: string | null;
  songRequestId: string | null;
  calendarConnectionId: string | null;
  createdAt: string;
  updatedAt: string;
  contact: { id: string; fullName: string; email: string | null; phone: string | null } | null;
  organization: { id: string; name: string } | null;
  workshopRequest: { id: string; title: string; status: string } | null;
  songRequest: { id: string; title: string; status: string } | null;
};

export function AppointmentDetailPage({
  item: initialItem,
  contacts,
  organizations,
  workshopRequests,
  songRequests,
}: {
  item: AppointmentItem;
  contacts: OptionItem[];
  organizations: OptionItem[];
  workshopRequests: LinkedItem[];
  songRequests: LinkedItem[];
}) {
  const router = useRouter();
  const [item, setItem] = useState<AppointmentItem>(initialItem);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    title: item.title,
    description: item.description ?? '',
    startAt: toLocalInputValue(item.startAt),
    endAt: toLocalInputValue(item.endAt),
    type: item.type,
    status: item.status,
    contactId: item.contactId ?? '',
    organizationId: item.organizationId ?? '',
    workshopRequestId: item.workshopRequestId ?? '',
    songRequestId: item.songRequestId ?? '',
    location: item.location ?? '',
    notes: item.notes ?? '',
  });

  function openEdit() {
    setForm({
      title: item.title,
      description: item.description ?? '',
      startAt: toLocalInputValue(item.startAt),
      endAt: toLocalInputValue(item.endAt),
      type: item.type,
      status: item.status,
      contactId: item.contactId ?? '',
      organizationId: item.organizationId ?? '',
      workshopRequestId: item.workshopRequestId ?? '',
      songRequestId: item.songRequestId ?? '',
      location: item.location ?? '',
      notes: item.notes ?? '',
    });
    setError(null);
    setSuccess(null);
    setEditOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!form.startAt || !form.endAt) { setError('Les dates sont obligatoires.'); return; }
    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setError('La date de fin doit être postérieure au début.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/appointments/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          calendarConnectionId: item.calendarConnectionId ?? '',
        }),
      });

      type ApiResponse = { item?: AppointmentItem; error?: string };
      const data = await response.json().catch(() => null) as ApiResponse | null;
      if (!response.ok || !data?.item) {
        throw new Error(data?.error ?? 'Enregistrement impossible');
      }

      const updated = data.item;
      const contactInfo = contacts.find((c) => c.id === updated.contactId);
      const orgInfo = organizations.find((o) => o.id === updated.organizationId);
      const workshopInfo = workshopRequests.find((w) => w.id === updated.workshopRequestId);
      const songInfo = songRequests.find((s) => s.id === updated.songRequestId);

      setItem({
        ...item,
        ...updated,
        contact: contactInfo
          ? { id: contactInfo.id, fullName: contactInfo.label, email: item.contact?.email ?? null, phone: item.contact?.phone ?? null }
          : item.contact,
        organization: orgInfo ? { id: orgInfo.id, name: orgInfo.label } : item.organization,
        workshopRequest: workshopInfo
          ? { id: workshopInfo.id, title: workshopInfo.label, status: item.workshopRequest?.status ?? 'PENDING' }
          : item.workshopRequest,
        songRequest: songInfo
          ? { id: songInfo.id, title: songInfo.label, status: item.songRequest?.status ?? 'PENDING' }
          : item.songRequest,
      });
      setSuccess('Rendez-vous mis à jour.');
      setEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Confirmer l\'annulation du rendez-vous ? L\'événement sera marqué Annulé.')) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/appointments/${item.id}`, { method: 'DELETE' });
      type DeleteResponse = { success?: boolean; error?: string };
      const data = await response.json().catch(() => null) as DeleteResponse | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? 'Suppression impossible');
      }
      router.push('/crm/calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setDeleting(false);
    }
  }

  function handleCopy() {
    const text = [
      item.title,
      `Date : ${formatDateLong(item.startAt)}`,
      `Horaire : ${formatTime(item.startAt)} – ${formatTime(item.endAt)} (${formatDuration(item.startAt, item.endAt)})`,
      item.location ? `Lieu : ${item.location}` : null,
      item.contact ? `Contact : ${item.contact.fullName}` : null,
      item.organization ? `Organisation : ${item.organization.name}` : null,
      item.meetingUrl ? `Lien : ${item.meetingUrl}` : null,
      item.notes ? `Notes : ${item.notes}` : null,
    ].filter(Boolean).join('\n');

    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const statusClass = STATUS_COLORS[item.status] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/30';

  return (
    <section className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/crm/calendar"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Calendrier
            </Link>
            <span className="text-slate-600">/</span>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Rendez-vous</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{item.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
              {STATUS_LABELS[item.status] ?? item.status}
            </span>
            <span className="text-xs text-slate-400">{TYPE_LABELS[item.type] ?? item.type}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button
            onClick={openEdit}
            className="rounded-xl border border-primary-700/60 bg-primary-950/30 px-4 py-2 text-sm text-primary-200 hover:bg-primary-900/40"
          >
            Modifier
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-xl border border-red-800/60 px-4 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60"
          >
            {deleting ? 'Annulation...' : 'Annuler / Supprimer'}
          </button>
        </div>
      </div>

      {success ? (
        <div className="rounded-2xl border border-green-700/40 bg-green-950/20 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      ) : null}

      {error && !editOpen ? (
        <div className="rounded-2xl border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {/* Detail cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dates & horaire */}
        <div className="crm-surface p-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Horaire</p>
          <div className="space-y-2">
            <p className="text-sm text-slate-300 capitalize">{formatDateLong(item.startAt)}</p>
            <p className="text-lg font-semibold text-white">
              {formatTime(item.startAt)} – {formatTime(item.endAt)}
            </p>
            <p className="text-sm text-slate-400">Durée : {formatDuration(item.startAt, item.endAt)}</p>
          </div>
          {item.location ? (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400 mb-1">Lieu</p>
              <p className="text-sm text-slate-200">{item.location}</p>
            </div>
          ) : null}
          {item.meetingUrl ? (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400 mb-1">Lien de réunion</p>
              <a
                href={item.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-300 hover:text-primary-200 underline break-all"
              >
                {item.meetingUrl}
              </a>
            </div>
          ) : null}
        </div>

        {/* Personnes */}
        <div className="crm-surface p-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Personnes & Liens</p>

          {item.contact ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Contact</p>
                <p className="text-sm font-medium text-white">{item.contact.fullName}</p>
                {item.contact.email ? (
                  <a href={`mailto:${item.contact.email}`} className="text-xs text-primary-300 hover:underline">{item.contact.email}</a>
                ) : null}
                {item.contact.phone ? (
                  <a href={`tel:${item.contact.phone}`} className="block text-xs text-slate-400 hover:text-white">{item.contact.phone}</a>
                ) : null}
              </div>
              <Link
                href={`/crm/contacts/${item.contact.id}`}
                className="shrink-0 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Fiche
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucun contact lié</p>
          )}

          {item.organization ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Organisation</p>
                <p className="text-sm font-medium text-white">{item.organization.name}</p>
              </div>
              <Link
                href={`/crm/organizations/${item.organization.id}`}
                className="shrink-0 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Fiche
              </Link>
            </div>
          ) : null}

          {item.workshopRequest ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Atelier lié</p>
                <p className="text-sm font-medium text-white">{item.workshopRequest.title}</p>
                <p className="text-xs text-slate-400">{item.workshopRequest.status}</p>
              </div>
              <Link
                href={`/crm/workshop-requests/${item.workshopRequest.id}`}
                className="shrink-0 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Fiche
              </Link>
            </div>
          ) : null}

          {item.songRequest ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Demande chanson liée</p>
                <p className="text-sm font-medium text-white">{item.songRequest.title}</p>
                <p className="text-xs text-slate-400">{item.songRequest.status}</p>
              </div>
              <Link
                href={`/crm/song-requests/${item.songRequest.id}`}
                className="shrink-0 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Fiche
              </Link>
            </div>
          ) : null}

          {/* Actions communication */}
          {(item.contact?.email || item.contact?.phone) ? (
            <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
              {item.contact?.email ? (
                <a
                  href={`mailto:${item.contact.email}`}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Envoyer courriel
                </a>
              ) : null}
              {item.contact?.phone ? (
                <a
                  href={`tel:${item.contact.phone}`}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Appeler
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Notes & Description */}
      {(item.notes || item.description) ? (
        <div className="crm-surface p-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notes</p>
          {item.notes ? <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.notes}</p> : null}
          {item.description && item.description !== item.notes ? (
            <>
              {item.notes ? <hr className="border-slate-800" /> : null}
              <p className="text-sm text-slate-400 whitespace-pre-wrap">{item.description}</p>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Métadonnées */}
      <div className="crm-surface p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-3">Informations</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Identifiant</dt>
            <dd className="mt-0.5 font-mono text-xs text-slate-300">{item.id}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Créé le</dt>
            <dd className="mt-0.5 text-slate-300">{new Date(item.createdAt).toLocaleDateString('fr-CA')}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Mis à jour</dt>
            <dd className="mt-0.5 text-slate-300">{new Date(item.updatedAt).toLocaleDateString('fr-CA')}</dd>
          </div>
        </dl>
      </div>

      {/* Formulaire Modifier */}
      {editOpen ? (
        <div className="crm-surface p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Modification</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Modifier le rendez-vous</h3>
            </div>
            <button onClick={() => setEditOpen(false)} className="text-sm text-slate-400 hover:text-white">Fermer</button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">{error}</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Titre *</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Début *</span>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Fin *</span>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Statut</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Lieu</span>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Contact</span>
              <select
                value={form.contactId}
                onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                <option value="">Aucun</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Organisation</span>
              <select
                value={form.organizationId}
                onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                <option value="">Aucune</option>
                {organizations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Atelier lié</span>
              <select
                value={form.workshopRequestId}
                onChange={(e) => setForm((f) => ({ ...f, workshopRequestId: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                <option value="">Aucun atelier</option>
                {workshopRequests.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Demande chanson liée</span>
              <select
                value={form.songRequestId}
                onChange={(e) => setForm((f) => ({ ...f, songRequestId: e.target.value }))}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                <option value="">Aucune demande</option>
                {songRequests.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-2xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Bouton retour bas de page */}
      <div className="flex justify-start pt-2">
        <Link
          href="/crm/calendar"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au calendrier
        </Link>
      </div>
    </section>
  );
}
