'use client';

import { useState } from 'react';

const OUTLOOK_MESSAGE_URL = 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client';
const MAILTO_MESSAGE_URL = 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client';

type SongEditorPayload = {
  id: string;
  status: string;
  title: string | null;
  description: string | null;
  details: string | null;
  meetingDate: string | null;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number | null;
  meetingType: string | null;
  location: string | null;
  meetingNotes: string | null;
};

export function ClientSongRequestEditor({ initialItem, canEditInitially }: { initialItem: SongEditorPayload; canEditInitially: boolean }) {
  const [item, setItem] = useState(initialItem);
  const [canEdit, setCanEdit] = useState(canEditInitially);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/client/song-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title || '',
          description: item.description || '',
          details: item.details || '',
          meetingDate: item.meetingDate || '',
          startAt: item.startAt || '',
          endAt: item.endAt || '',
          durationMinutes: item.durationMinutes || undefined,
          meetingType: item.meetingType || '',
          location: item.location || '',
          meetingNotes: item.meetingNotes || '',
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string; blocked?: boolean; item?: SongEditorPayload } | null;
      if (!response.ok) {
        if (data?.blocked) setCanEdit(false);
        throw new Error(data?.error || 'Sauvegarde impossible');
      }
      if (data?.item) setItem((current) => ({ ...current, ...data.item }));
      setMessage('Demande mise a jour.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      {!canEdit ? (
        <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-4 text-sm text-primary-100">
          <p>Cette demande est confirmée. Pour la modifier, envoyez-nous un message.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-primary-400/40 bg-primary-400/15 px-3 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary-400/25">Envoyer un message</a>
            <a href={MAILTO_MESSAGE_URL} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:border-primary-500/40 hover:text-white">Fallback courriel</a>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs text-slate-400">Date de rencontre souhaitee</span>
              <input type="datetime-local" value={item.meetingDate ? item.meetingDate.slice(0, 16) : ''} onChange={(event) => setItem((current) => ({ ...current, meetingDate: event.target.value ? new Date(event.target.value).toISOString() : null }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Type de rencontre</span>
              <select value={item.meetingType || 'visio'} onChange={(event) => setItem((current) => ({ ...current, meetingType: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="telephone">Telephone</option>
                <option value="visio">Visio</option>
                <option value="en_personne">En personne</option>
                <option value="autre">Autre</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Debut</span>
              <input type="datetime-local" value={item.startAt ? item.startAt.slice(0, 16) : ''} onChange={(event) => setItem((current) => ({ ...current, startAt: event.target.value ? new Date(event.target.value).toISOString() : null }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Fin</span>
              <input type="datetime-local" value={item.endAt ? item.endAt.slice(0, 16) : ''} onChange={(event) => setItem((current) => ({ ...current, endAt: event.target.value ? new Date(event.target.value).toISOString() : null }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Duree (minutes)</span>
              <input type="number" min={1} max={1440} value={item.durationMinutes || ''} onChange={(event) => setItem((current) => ({ ...current, durationMinutes: Number(event.target.value || 0) || null }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-400">Lieu / lien visio</span>
              <input value={item.location || ''} onChange={(event) => setItem((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </label>
          </div>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Notes de rencontre</span>
            <textarea rows={3} value={item.meetingNotes || ''} onChange={(event) => setItem((current) => ({ ...current, meetingNotes: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </label>
          <button type="button" onClick={save} disabled={saving} className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary-500/20 disabled:opacity-60">{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
        </div>
      )}

      {message ? <p className="text-sm text-slate-200">{message}</p> : null}
    </section>
  );
}
