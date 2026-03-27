'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClientTaskRequestFormProps {
  token: string;
  songRequestId: string;
}

export function ClientTaskRequestForm({ token, songRequestId }: ClientTaskRequestFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/client-portal/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, songRequestId, title, description, dueDate }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Création impossible');
      }

      setTitle('');
      setDescription('');
      setDueDate('');
      setSuccess('Votre tâche a été ajoutée au dossier.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Ajouter une tâche</p>
      <div className="mt-4 space-y-3">
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Ajouter une précision ou demander un suivi"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Détail de la tâche ou de la demande"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? 'Envoi en cours...' : 'Créer la tâche'}
        </button>
      </div>
    </form>
  );
}