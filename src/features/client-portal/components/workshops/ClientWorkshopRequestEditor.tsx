'use client';

import { useState } from 'react';
import Link from 'next/link';
import { workshopSelectClassName } from '@/components/forms/select-styles';

const OUTLOOK_MESSAGE_URL = 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client';
const MAILTO_MESSAGE_URL = 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client';

type WorkshopPayload = {
  id: string;
  title: string;
  objectives: string;
  notes: string | null;
  participantEstimate: number | null;
  estimatedParticipants: number | null;
  location: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  durationMinutes: number | null;
  meetingType: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: string;
};

export function ClientWorkshopRequestEditor({ initialItem, canEditInitially }: { initialItem: WorkshopPayload; canEditInitially: boolean }) {
  const [item, setItem] = useState(initialItem);
  const [canEdit, setCanEdit] = useState(canEditInitially);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/client/workshop-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          objectives: item.objectives,
          notes: item.notes || '',
          participantEstimate: item.participantEstimate || item.estimatedParticipants || undefined,
          estimatedParticipants: item.estimatedParticipants || item.participantEstimate || undefined,
          location: item.location || '',
          requestedDate: item.requestedDate ? new Date(item.requestedDate).toISOString() : '',
          requestedTime: item.requestedTime || '',
          durationMinutes: item.durationMinutes || undefined,
          meetingType: item.meetingType || '',
          contactPerson: item.contactPerson || '',
          contactPhone: item.contactPhone || '',
          contactEmail: item.contactEmail || '',
        }),
      });

      const data = await response.json().catch(() => null) as { error?: string; blocked?: boolean; item?: WorkshopPayload } | null;
      if (!response.ok) {
        if (data?.blocked) {
          setCanEdit(false);
          setIsEditing(false);
        }
        throw new Error(data?.error || 'Sauvegarde impossible');
      }

      if (data?.item) {
        setItem((current) => ({ ...current, ...data.item }));
      }
      setIsEditing(false);
      setMessage('Demande enregistrée avec succès.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Statut</p>
        <p className="mt-1 text-sm text-slate-200">{item.status}</p>
      </div>

      {!canEdit ? (
        <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-4 text-sm text-primary-100">
          <p>Cette demande ne peut plus être modifiée directement. Contactez Création Nowis pour faire un changement.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-primary-400/40 bg-primary-400/15 px-3 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary-400/25">Envoyer un message</a>
            <a href={MAILTO_MESSAGE_URL} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:border-primary-500/40 hover:text-white">Fallback courriel</a>
          </div>
        </div>
      ) : !isEditing ? (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoField label="Titre / sujet" value={item.title} />
            <InfoField label="Participants" value={String(item.estimatedParticipants || item.participantEstimate || '—')} />
            <InfoField label="Date souhaitée" value={formatDate(item.requestedDate)} />
            <InfoField label="Heure souhaitée" value={item.requestedTime || '—'} />
            <InfoField label="Durée (minutes)" value={item.durationMinutes ? String(item.durationMinutes) : '—'} />
            <InfoField label="Type de rencontre" value={item.meetingType || '—'} />
            <InfoField label="Lieu souhaité" value={item.location || '—'} full />
            <InfoField label="Responsable" value={item.contactPerson || '—'} />
            <InfoField label="Téléphone" value={item.contactPhone || '—'} />
            <InfoField label="Courriel" value={item.contactEmail || '—'} full />
            <InfoField label="Description / message" value={item.objectives || '—'} full multiline />
            <InfoField label="Notes / précisions" value={item.notes || '—'} full multiline />
          </div>

          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setIsEditing(true);
            }}
            className="w-full rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary-500/20"
          >
            Modifier
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs text-slate-400">Titre / sujet</span>
              <input value={item.title} onChange={(event) => setItem((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Participants</span>
              <input type="number" min={1} value={item.estimatedParticipants || item.participantEstimate || ''} onChange={(event) => setItem((current) => ({ ...current, estimatedParticipants: Number(event.target.value || 0), participantEstimate: Number(event.target.value || 0) }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Date souhaitee</span>
              <input type="date" value={item.requestedDate ? item.requestedDate.slice(0, 10) : ''} onChange={(event) => setItem((current) => ({ ...current, requestedDate: event.target.value ? `${event.target.value}T09:00:00.000Z` : null }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Heure souhaitee</span>
              <input value={item.requestedTime || ''} onChange={(event) => setItem((current) => ({ ...current, requestedTime: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Duree (minutes)</span>
              <input type="number" min={1} max={1440} value={item.durationMinutes || ''} onChange={(event) => setItem((current) => ({ ...current, durationMinutes: Number(event.target.value || 0) || null }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Type de rencontre</span>
              <select value={item.meetingType || 'autre'} onChange={(event) => setItem((current) => ({ ...current, meetingType: event.target.value }))} className={workshopSelectClassName}>
                <option value="telephone">Telephone</option>
                <option value="visio">Visio</option>
                <option value="en_personne">En personne</option>
                <option value="autre">Autre</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-400">Lieu souhaite</span>
              <input value={item.location || ''} onChange={(event) => setItem((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Responsable</span>
              <input value={item.contactPerson || ''} onChange={(event) => setItem((current) => ({ ...current, contactPerson: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Telephone</span>
              <input value={item.contactPhone || ''} onChange={(event) => setItem((current) => ({ ...current, contactPhone: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-400">Courriel</span>
              <input type="email" value={item.contactEmail || ''} onChange={(event) => setItem((current) => ({ ...current, contactEmail: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-400">Description / message</span>
              <textarea rows={4} value={item.objectives || ''} onChange={(event) => setItem((current) => ({ ...current, objectives: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-slate-400">Notes / precisions</span>
              <textarea rows={3} value={item.notes || ''} onChange={(event) => setItem((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
          </div>

          <button type="button" onClick={save} disabled={saving} className="w-full rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary-500/20 disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setMessage(null);
            }}
            className="w-full rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-primary-500/40 hover:text-white"
          >
            Annuler
          </button>
        </div>
      )}

      {message ? <p className="text-sm text-slate-200">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Link href="/client/workshops" className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:text-white">Retour aux ateliers</Link>
      </div>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(value));
}

function InfoField({
  label,
  value,
  full = false,
  multiline = false,
}: {
  label: string;
  value: string;
  full?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm ${full ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-slate-100 ${multiline ? 'whitespace-pre-wrap leading-6' : ''}`}>{value}</p>
    </div>
  );
}
