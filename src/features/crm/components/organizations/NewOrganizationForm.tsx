'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'SCHOOL', label: 'Ecole' },
  { value: 'COMMUNITY_ORG', label: 'Organisme' },
  { value: 'DAYCARE', label: 'Garderie' },
  { value: 'CAMP', label: 'Camp' },
  { value: 'OTHER', label: 'Autre' },
] as const;

const ORGANIZATION_STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Prospection' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const;

export function NewOrganizationForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'SCHOOL',
    status: 'LEAD',
    email: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/crm/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null) as { error?: string; item?: { id?: string } } | null;
      if (!response.ok || !payload?.item?.id) {
        throw new Error(payload?.error || 'Creation impossible');
      }

      router.push(`/crm/organizations/${payload.item.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Creation impossible');
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Nouvelle organisation</h2>
          <p className="text-sm text-slate-400">Creez la fiche, puis vous serez redirige vers son detail.</p>
        </div>
        <Link
          href="/crm/organizations"
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white"
        >
          Retour aux organisations
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Nom</span>
            <input
              value={form.name}
              required
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Type</span>
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {ORGANIZATION_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Statut</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {ORGANIZATION_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Email</span>
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Telephone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Ville</span>
            <input
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="md:col-span-2 xl:col-span-3">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Adresse</span>
            <input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="md:col-span-2 xl:col-span-3">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="min-h-[96px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? 'Creation...' : 'Creer la fiche'}
          </button>
        </div>
      </form>
    </section>
  );
}
