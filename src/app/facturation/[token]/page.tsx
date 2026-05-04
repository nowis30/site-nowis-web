'use client';

import { useEffect, useState } from 'react';

type BillingPayload = {
  id: string;
  fullName: string;
  billingCompanyName: string | null;
  billingLegalName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  billingTaxId: string | null;
  billingNotes: string | null;
};

export default function PublicBillingPage({ params }: { params: { token: string } }) {
  const [item, setItem] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/public/billing/${params.token}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as { item?: BillingPayload; error?: string } | null;
      if (cancelled) return;
      if (!response.ok || !data?.item) {
        setError(data?.error || 'Lien invalide ou expire.');
      } else {
        setItem(data.item);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!item) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/public/billing/${params.token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Enregistrement impossible');
      setSuccess('Informations enregistrees. Merci.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">Chargement...</main>;
  }

  if (error && !item) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
        <div className="rounded-2xl border border-red-700/40 bg-red-950/20 p-5 text-sm text-red-200">{error}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">Completer vos informations de facturation</h1>
      <p className="mt-2 text-sm text-slate-400">Merci de verifier vos informations pour finaliser votre facture.</p>

      <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Nom</span><input value={item?.fullName || ''} disabled className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300" /></label>
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Societe</span><input value={item?.billingCompanyName || ''} onChange={(event) => setItem((current) => current ? ({ ...current, billingCompanyName: event.target.value }) : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Courriel facturation</span><input value={item?.billingEmail || ''} onChange={(event) => setItem((current) => current ? ({ ...current, billingEmail: event.target.value }) : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Adresse ligne 1</span><input value={item?.billingAddressLine1 || ''} onChange={(event) => setItem((current) => current ? ({ ...current, billingAddressLine1: event.target.value }) : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
        <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Ville</span><input value={item?.billingCity || ''} onChange={(event) => setItem((current) => current ? ({ ...current, billingCity: event.target.value }) : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Code postal</span><input value={item?.billingPostalCode || ''} onChange={(event) => setItem((current) => current ? ({ ...current, billingPostalCode: event.target.value }) : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
          <label className="block"><span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Pays</span><input value={item?.billingCountry || ''} onChange={(event) => setItem((current) => current ? ({ ...current, billingCountry: event.target.value }) : current)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </form>
    </main>
  );
}
