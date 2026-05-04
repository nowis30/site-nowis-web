'use client';

import { useState } from 'react';

type BillingFields = {
  billingLegalName: string | null;
  billingCompanyName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  billingTaxId: string | null;
};

type ClientBillingFormProps = {
  initial: BillingFields & { id: string; fullName: string; email: string };
  nextUrl?: string;
};

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-200';

export function ClientBillingForm({ initial, nextUrl }: ClientBillingFormProps) {
  const [fields, setFields] = useState<BillingFields>({
    billingLegalName: initial.billingLegalName || initial.fullName,
    billingCompanyName: initial.billingCompanyName,
    billingEmail: initial.billingEmail || initial.email,
    billingPhone: initial.billingPhone,
    billingAddressLine1: initial.billingAddressLine1,
    billingAddressLine2: initial.billingAddressLine2,
    billingCity: initial.billingCity,
    billingState: initial.billingState,
    billingPostalCode: initial.billingPostalCode,
    billingCountry: initial.billingCountry || 'Canada',
    billingTaxId: initial.billingTaxId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(key: keyof BillingFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value || null }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const required = [
      { key: 'billingLegalName', label: 'Nom de facturation' },
      { key: 'billingEmail', label: 'Courriel de facturation' },
      { key: 'billingAddressLine1', label: 'Adresse' },
      { key: 'billingCity', label: 'Ville' },
      { key: 'billingState', label: 'Province / Etat' },
      { key: 'billingPostalCode', label: 'Code postal' },
      { key: 'billingCountry', label: 'Pays' },
    ] as const;

    for (const field of required) {
      if (!fields[field.key]?.trim()) {
        setError(`Le champ "${field.label}" est requis.`);
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/api/client/facturation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Enregistrement impossible');
      setSuccess(true);
      window.location.href = nextUrl || '/client';
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Compte</p>
        <p className="mt-2 text-sm text-slate-300">
          <span className="font-medium text-white">{initial.fullName}</span>{' '}
          <span className="text-slate-500">·</span>{' '}
          <span className="text-slate-400">{initial.email}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Coordonnées de facturation</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nom de facturation <span className="text-amber-400">*</span></label>
            <input
              value={fields.billingLegalName ?? ''}
              onChange={(e) => set('billingLegalName', e.target.value)}
              placeholder={initial.fullName}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Société / organisme</label>
            <input
              value={fields.billingCompanyName ?? ''}
              onChange={(e) => set('billingCompanyName', e.target.value)}
              placeholder="Facultatif"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Courriel de facturation <span className="text-amber-400">*</span></label>
            <input
              type="email"
              value={fields.billingEmail ?? ''}
              onChange={(e) => set('billingEmail', e.target.value)}
              placeholder={initial.email}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              value={fields.billingPhone ?? ''}
              onChange={(e) => set('billingPhone', e.target.value)}
              placeholder="819 000-0000"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Adresse <span className="text-amber-400">*</span></p>

        <div>
          <label className={labelClass}>Adresse ligne 1 <span className="text-amber-400">*</span></label>
          <input
            value={fields.billingAddressLine1 ?? ''}
            onChange={(e) => set('billingAddressLine1', e.target.value)}
            placeholder="123 Rue Principale"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Adresse ligne 2</label>
          <input
            value={fields.billingAddressLine2 ?? ''}
            onChange={(e) => set('billingAddressLine2', e.target.value)}
            placeholder="App. 4, Bureau 200…"
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Ville <span className="text-amber-400">*</span></label>
            <input
              value={fields.billingCity ?? ''}
              onChange={(e) => set('billingCity', e.target.value)}
              placeholder="Drummondville"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Province / État <span className="text-amber-400">*</span></label>
            <input
              value={fields.billingState ?? ''}
              onChange={(e) => set('billingState', e.target.value)}
              placeholder="Québec"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Code postal <span className="text-amber-400">*</span></label>
            <input
              value={fields.billingPostalCode ?? ''}
              onChange={(e) => set('billingPostalCode', e.target.value)}
              placeholder="J2A 2G2"
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Pays <span className="text-amber-400">*</span></label>
          <input
            value={fields.billingCountry ?? ''}
            onChange={(e) => set('billingCountry', e.target.value)}
            placeholder="Canada"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Autre</p>
        <div>
          <label className={labelClass}>Numéro de TPS / TVQ (si applicable)</label>
          <input
            value={fields.billingTaxId ?? ''}
            onChange={(e) => set('billingTaxId', e.target.value)}
            placeholder="Facultatif"
            className={inputClass}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {success && !nextUrl ? (
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
          Informations enregistrées avec succès.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60 sm:w-auto"
      >
        {saving ? 'Enregistrement…' : success && nextUrl ? 'Continuer…' : 'Sauvegarder mes informations'}
      </button>
    </form>
  );
}
