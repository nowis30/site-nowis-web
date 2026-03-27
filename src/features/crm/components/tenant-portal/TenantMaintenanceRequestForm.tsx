'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TenantMaintenanceRequestFormProps {
  token: string;
}

export function TenantMaintenanceRequestForm({ token }: TenantMaintenanceRequestFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/tenant-portal/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, title, description, priority }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Création impossible');
      }

      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setSuccess('Votre demande de maintenance a été transmise.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Demande de maintenance</p>
      <div className="mt-4 space-y-3">
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titre du problème"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Décrivez le problème"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
          <option value="LOW">Faible</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="HIGH">Haute</option>
          <option value="URGENT">Urgente</option>
        </select>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <button type="submit" disabled={loading} className="inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
          {loading ? 'Envoi en cours...' : 'Créer la demande'}
        </button>
      </div>
    </form>
  );
}
