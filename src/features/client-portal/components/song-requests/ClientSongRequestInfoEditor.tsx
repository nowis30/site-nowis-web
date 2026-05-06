'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [item, setItem] = useState(initial);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const canConfirmDelete = deleteChecked && deleteKeyword.trim().toUpperCase() === 'SUPPRIMER' && !deleting;

  async function confirmDelete() {
    if (!canConfirmDelete) return;
    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/client/song-requests/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: true,
          confirmationText: deleteKeyword,
          reason: deleteReason,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        redirectTo?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || 'Suppression impossible');
      }

      router.push(data?.redirectTo || '/client/song-requests');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Erreur inconnue', ok: false });
    } finally {
      setDeleting(false);
    }
  }

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => {
              setShowDeleteConfirm((current) => !current);
              setMessage(null);
            }}
            className="rounded-xl border border-red-700/60 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-500 hover:text-red-100"
          >
            Supprimer définitivement
          </button>
        </div>
      ) : null}

      {canEdit && showDeleteConfirm ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-100">
          <p className="font-medium">Suppression définitive (double validation)</p>
          <p className="mt-2 text-red-200">Cette action retirera la demande de votre portail et ne pourra pas être annulée par vous.</p>

          <label className="mt-3 flex items-start gap-2 text-xs text-red-200">
            <input
              type="checkbox"
              checked={deleteChecked}
              onChange={(event) => setDeleteChecked(event.target.checked)}
              className="mt-0.5"
            />
            Je confirme vouloir supprimer cette demande définitivement.
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-red-200">Tapez SUPPRIMER pour confirmer</span>
            <input
              value={deleteKeyword}
              onChange={(event) => setDeleteKeyword(event.target.value)}
              className="w-full rounded-xl border border-red-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="SUPPRIMER"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-red-200">Raison (optionnel)</span>
            <textarea
              rows={2}
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              className="w-full rounded-xl border border-red-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Ex: erreur dans la demande"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!canConfirmDelete}
              className="rounded-xl border border-red-700 bg-red-700/20 px-3 py-2 text-xs font-semibold text-red-100 disabled:opacity-50"
            >
              {deleting ? 'Suppression en cours...' : 'Confirmer la suppression'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteChecked(false);
                setDeleteKeyword('');
                setDeleteReason('');
              }}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p> : null}
    </div>
  );
}
