'use client';

import { useState } from 'react';

type InfoItem = {
  id: string;
  title: string | null;
  description: string | null;
  musicStyle: string;
  mood: string;
  lyrics: string | null;
  clientNotes: string;
  clientMessage: string | null;
  desiredDeadline: string | null;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-sm">
      <span className="text-slate-400">{label} : </span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  );
}

export function ClientSongRequestInfoEditor({
  initial,
  canEdit,
}: {
  initial: InfoItem;
  canEdit: boolean;
}) {
  const [item, setItem] = useState(initial);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

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
          musicStyle: item.musicStyle || '',
          mood: item.mood || '',
          lyrics: item.lyrics || '',
          clientNotes: item.clientNotes || '',
          desiredDeadline: item.desiredDeadline || '',
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        item?: Partial<InfoItem>;
      } | null;

      if (!response.ok) throw new Error(data?.error || 'Sauvegarde impossible');
      if (data?.item) setItem((prev) => ({ ...prev, ...data.item }));
      setIsEditing(false);
      setMessage({ text: 'Demande mise a jour.', ok: true });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Erreur inconnue', ok: false });
    } finally {
      setSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
        <label>
          <span className="mb-1 block text-xs text-slate-400">Titre</span>
          <input
            value={item.title || ''}
            onChange={(event) => setItem((current) => ({ ...current, title: event.target.value }))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Titre de la demande"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Description</span>
          <textarea
            rows={4}
            value={item.description || ''}
            onChange={(event) => setItem((current) => ({ ...current, description: event.target.value }))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Description de la chanson"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs text-slate-400">Style musical</span>
            <input
              value={item.musicStyle || ''}
              onChange={(event) => setItem((current) => ({ ...current, musicStyle: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Ambiance</span>
            <input
              value={item.mood || ''}
              onChange={(event) => setItem((current) => ({ ...current, mood: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Paroles fournies</span>
          <textarea
            rows={4}
            value={item.lyrics || ''}
            onChange={(event) => setItem((current) => ({ ...current, lyrics: event.target.value }))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Consignes</span>
          <textarea
            rows={3}
            value={item.clientNotes || ''}
            onChange={(event) => setItem((current) => ({ ...current, clientNotes: event.target.value }))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Date souhaitee</span>
          <input
            type="date"
            value={item.desiredDeadline ? item.desiredDeadline.slice(0, 10) : ''}
            onChange={(event) =>
              setItem((current) => ({
                ...current,
                desiredDeadline: event.target.value ? new Date(event.target.value).toISOString() : null,
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary-500/20 disabled:opacity-60"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setMessage(null);
            }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500"
          >
            Annuler
          </button>
        </div>

        {message ? <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <Field label="Style" value={item.musicStyle} />
        <Field label="Ambiance" value={item.mood} />
        <Field
          label="Date souhaitee"
          value={
            item.desiredDeadline
              ? new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(item.desiredDeadline))
              : null
          }
        />
      </div>

      {item.description ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
          <p>{item.description}</p>
        </div>
      ) : null}

      {item.lyrics ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Paroles</p>
          <p className="whitespace-pre-wrap">{item.lyrics}</p>
        </div>
      ) : null}

      {item.clientNotes || item.clientMessage ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
          {item.clientMessage ? <p>{item.clientMessage}</p> : null}
          {item.clientNotes ? <p className={item.clientMessage ? 'mt-2' : ''}>{item.clientNotes}</p> : null}
        </div>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white"
        >
          Modifier
        </button>
      ) : null}

      {message ? <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p> : null}
    </div>
  );
}
