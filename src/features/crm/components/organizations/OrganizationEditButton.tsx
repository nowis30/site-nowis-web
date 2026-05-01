'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, X } from 'lucide-react';

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'SCHOOL', label: 'École' },
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

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  status: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
}

interface FormState {
  name: string;
  type: string;
  status: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

function buildInitialForm(org: OrganizationData): FormState {
  return {
    name: org.name,
    type: org.type,
    status: org.status,
    email: org.email ?? '',
    phone: org.phone ?? '',
    address: org.address ?? '',
    city: org.city ?? '',
    notes: org.notes ?? '',
  };
}

function Modal({
  organization,
  onClose,
}: {
  organization: OrganizationData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialForm(organization));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crm/organizations/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          status: form.status,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || 'Enregistrement impossible');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-2xl rounded-[2rem] border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CRM — Organisation</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Modifier l'organisation</h3>
            <p className="mt-1 text-sm text-slate-400">{organization.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Nom <span className="text-red-400">*</span></span>
            <input
              required
              minLength={2}
              maxLength={160}
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Type</span>
            <select
              value={form.type}
              onChange={(event) => setField('type', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {ORGANIZATION_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Statut</span>
            <select
              value={form.status}
              onChange={(event) => setField('status', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {ORGANIZATION_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Courriel</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Téléphone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Ville</span>
            <input
              value={form.city}
              onChange={(event) => setField('city', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Adresse</span>
            <input
              value={form.address}
              onChange={(event) => setField('address', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Notes internes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            ✓ Organisation sauvegardée avec succès.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="rounded-2xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enregistrement…' : success ? 'Sauvegardé ✓' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function OrganizationEditButton({ organization }: { organization: OrganizationData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 hover:border-primary-500/60 hover:bg-slate-700 hover:text-white"
      >
        <Pencil size={13} /> Modifier l'organisation
      </button>
      {open ? <Modal organization={organization} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
