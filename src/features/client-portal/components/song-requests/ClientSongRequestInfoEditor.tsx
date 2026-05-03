'use client';

import { useState } from 'react';

const OUTLOOK_MESSAGE_URL =
  'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client';

type InfoItem = {
  id: string;
  status: string;
  title: string | null;
  recipientName: string;
  occasion: string;
  style: string;
  mood: string;
  language: string | null;
  description: string | null;
  details: string;
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
          recipientName: item.recipientName,
          occasion: item.occasion,
          style: item.style,
          mood: item.mood,
          language: item.language || '',
          description: item.description || '',
          details: item.details,
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
      setMessage({ text: 'Informations mises à jour.', ok: true });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Erreur inconnue', ok: false });
    } finally {
      setSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">Titre de la chanson</span>
            <input
              value={item.title || ''}
              onChange={(e) => setItem((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ex : Pour mes parents à leur anniversaire"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Destinataire *</span>
            <input
              value={item.recipientName}
              onChange={(e) => setItem((p) => ({ ...p, recipientName: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Nom de la personne"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Occasion *</span>
            <input
              value={item.occasion}
              onChange={(e) => setItem((p) => ({ ...p, occasion: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ex : Anniversaire, Mariage..."
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Style musical *</span>
            <input
              value={item.style}
              onChange={(e) => setItem((p) => ({ ...p, style: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ex : Pop, Folk, Jazz..."
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Ambiance / humeur *</span>
            <input
              value={item.mood}
              onChange={(e) => setItem((p) => ({ ...p, mood: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ex : Joyeuse, Émouvante..."
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Langue</span>
            <select
              value={item.language || ''}
              onChange={(e) => setItem((p) => ({ ...p, language: e.target.value || null }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Non spécifié</option>
              <option value="Français">Français</option>
              <option value="Anglais">Anglais</option>
              <option value="Bilingue">Bilingue</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Date souhaitée</span>
            <input
              type="date"
              value={item.desiredDeadline ? item.desiredDeadline.slice(0, 10) : ''}
              onChange={(e) =>
                setItem((p) => ({
                  ...p,
                  desiredDeadline: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </label>
        </div>
        <label>
          <span className="mb-1 block text-xs text-slate-400">Description / contexte</span>
          <textarea
            rows={4}
            value={item.description || ''}
            onChange={(e) => setItem((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Parlez-nous du contexte, de la personne, de ce que vous voulez exprimer..."
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-slate-400">Détails supplémentaires</span>
          <textarea
            rows={3}
            value={item.details}
            onChange={(e) => setItem((p) => ({ ...p, details: e.target.value }))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Anecdotes, paroles suggérées, références musicales..."
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
            onClick={() => { setIsEditing(false); setMessage(null); }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500"
          >
            Annuler
          </button>
        </div>
        {message ? (
          <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>
        ) : null}
      </div>
    );
  }

  // Mode affichage
  return (
    <div className="space-y-3">
      <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <Field label="Destinataire" value={item.recipientName} />
        <Field label="Occasion" value={item.occasion} />
        <Field label="Style" value={item.style} />
        <Field label="Ambiance" value={item.mood} />
        <Field label="Langue" value={item.language} />
        <Field
          label="Date souhaitée"
          value={
            item.desiredDeadline
              ? new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(
                  new Date(item.desiredDeadline),
                )
              : null
          }
        />
      </div>
      {item.description || item.details ? (
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
          {item.description ? <p>{item.description}</p> : null}
          {item.details ? <p>{item.details}</p> : null}
        </div>
      ) : null}
      {canEdit ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
        >
          Modifier les informations
        </button>
      ) : (
        <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-3 text-sm text-primary-100">
          Demande confirmée. Pour modifier,{' '}
          <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="underline">
            envoyez-nous un message
          </a>
          .
        </div>
      )}
      {message ? (
        <p className={`text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>
      ) : null}
    </div>
  );
}
