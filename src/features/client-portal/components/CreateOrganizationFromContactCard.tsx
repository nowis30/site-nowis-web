'use client';

import { FormEvent, useState } from 'react';

export function CreateOrganizationFromContactCard() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'OTHER',
    status: 'LEAD',
    city: '',
    address: '',
    email: '',
    phone: '',
    notes: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/client-portal/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null) as { error?: string; item?: { name?: string } } | null;
      if (!response.ok) {
        throw new Error(payload?.error || 'Création impossible');
      }

      setSuccess(`Organisation créée: ${payload?.item?.name || form.name}`);
      setForm({
        name: '',
        type: 'OTHER',
        status: 'LEAD',
        city: '',
        address: '',
        email: '',
        phone: '',
        notes: '',
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
      <h3 className="text-base font-semibold text-white">Créer une organisation depuis votre contact</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Cette action ajoute une organisation et vous associe automatiquement comme contact principal dans le CRM.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs text-slate-400">Nom de l'organisation</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white"
            required
            minLength={2}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Type</span>
          <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
            {['SCHOOL', 'COMMUNITY_ORG', 'DAYCARE', 'CAMP', 'OTHER'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Statut</span>
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white">
            {['LEAD', 'ACTIVE', 'INACTIVE'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Ville</span>
          <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white" />
        </label>

        <label>
          <span className="mb-1 block text-xs text-slate-400">Téléphone</span>
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white" />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-xs text-slate-400">Email</span>
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white" />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-xs text-slate-400">Adresse</span>
          <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white" />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-xs text-slate-400">Note (optionnel)</span>
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white" />
        </label>

        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={loading} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
            {loading ? 'Création...' : 'Créer l organisation'}
          </button>
          {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
        </div>
      </form>
    </article>
  );
}
