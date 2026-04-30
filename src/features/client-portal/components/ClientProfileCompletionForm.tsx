'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClientRequestType } from '@/features/client-portal/profile';

interface ClientProfileCompletionFormProps {
  initial: {
    phone: string;
    billingAddress: string;
    requestPostalAddress: string;
    requestType: ClientRequestType;
  };
}

export function ClientProfileCompletionForm({ initial }: ClientProfileCompletionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/client-portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || 'Mise a jour impossible');
      }

      setSuccess('Vos informations ont ete enregistrees.');
      router.refresh();
      router.push('/client/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm text-slate-300">Telephone</span>
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            required
          />
        </label>

        <label>
          <span className="mb-1 block text-sm text-slate-300">Type de demande principale</span>
          <select
            value={form.requestType}
            onChange={(event) => setForm((current) => ({ ...current, requestType: event.target.value as ClientRequestType }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
          >
            <option value="ATELIER">Atelier</option>
            <option value="CHANSON">Chanson</option>
            <option value="ATELIER_ET_CHANSON">Atelier et chanson</option>
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-sm text-slate-300">Adresse de facturation</span>
          <textarea
            value={form.billingAddress}
            onChange={(event) => setForm((current) => ({ ...current, billingAddress: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            rows={3}
            required
          />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-sm text-slate-300">Adresse postale de la demande (atelier/chanson)</span>
          <textarea
            value={form.requestPostalAddress}
            onChange={(event) => setForm((current) => ({ ...current, requestPostalAddress: event.target.value }))}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
            rows={3}
            required
          />
        </label>
      </div>

      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
          {loading ? 'Enregistrement...' : 'Enregistrer et continuer'}
        </button>
      </div>
    </form>
  );
}
