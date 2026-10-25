'use client';

import { useState } from 'react';

type BillingProfileForm = {
  displayName: string;
  companyName: string;
  legalLabel: string;
  tradeName: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  neq: string;
  gstNumber: string;
  qstNumber: string;
  paymentTerms: string;
  footerNote: string;
  taxesEnabled: boolean;
  taxRateGst: string;
  taxRateQst: string;
  currency: string;
};

export function BillingProfileManager({ initialProfile }: { initialProfile: BillingProfileForm }) {
  const [form, setForm] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/crm/billing-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          taxRateGst: Number(form.taxRateGst || 0),
          taxRateQst: Number(form.taxRateQst || 0),
          currency: form.currency.toUpperCase(),
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Enregistrement impossible');
      setMessage('Profil de facturation enregistré.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div>
        <h3 className="text-xl font-semibold text-white">Profil de facturation</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">Ces renseignements apparaissent sur les prochaines factures et soumissions. Les taxes ne sont ajoutées que si la TPS ou la TVQ est active et que son numéro est enregistré.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Nom affiche</span><input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Entreprise</span><input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Courriel</span><input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Telephone</span><input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Adresse ligne 1</span><input value={form.addressLine1} onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Adresse ligne 2</span><input value={form.addressLine2} onChange={(event) => setForm((current) => ({ ...current, addressLine2: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Ville</span><input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Province/Etat</span><input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Code postal</span><input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Pays</span><input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">NEQ</span><input inputMode="numeric" autoComplete="off" value={form.neq} onChange={(event) => setForm((current) => ({ ...current, neq: event.target.value }))} placeholder="2264731649" className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Numéro de TPS</span><input autoComplete="off" value={form.gstNumber} onChange={(event) => setForm((current) => ({ ...current, gstNumber: event.target.value }))} placeholder="123456789 RT0001" className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Numéro de TVQ</span><input autoComplete="off" value={form.qstNumber} onChange={(event) => setForm((current) => ({ ...current, qstNumber: event.target.value }))} placeholder="1234567890 TQ0001" className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Autre identifiant</span><input value={form.taxId} onChange={(event) => setForm((current) => ({ ...current, taxId: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Devise</span><input value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={form.taxesEnabled} onChange={(event) => setForm((current) => ({ ...current, taxesEnabled: event.target.checked }))} />Ajouter la TPS et la TVQ</label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Taux TPS</span><input type="number" min={0} max={1} step="0.00001" value={form.taxRateGst} onChange={(event) => setForm((current) => ({ ...current, taxRateGst: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Taux TVQ</span><input type="number" min={0} max={1} step="0.00001" value={form.taxRateQst} onChange={(event) => setForm((current) => ({ ...current, taxRateQst: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Conditions de paiement</span><textarea rows={3} value={form.paymentTerms} onChange={(event) => setForm((current) => ({ ...current, paymentTerms: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Note de bas de page</span><textarea rows={3} value={form.footerNote} onChange={(event) => setForm((current) => ({ ...current, footerNote: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100" /></label>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <button type="button" onClick={() => void save()} disabled={loading} className="min-h-11 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
        {loading ? 'Enregistrement...' : 'Sauvegarder le profil'}
      </button>
    </section>
  );
}
