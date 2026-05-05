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

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-200';
const disabledInputClass =
  'w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? <span className="ml-1 text-amber-400">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

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
        setError(data?.error || 'Lien invalide ou expiré.');
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

  function update(key: keyof BillingPayload, value: string) {
    setItem((current) => (current ? { ...current, [key]: value || null } : current));
  }

  const legalName = item?.billingLegalName ?? item?.fullName ?? '';
  const billingEmail = item?.billingEmail ?? '';
  const country = item?.billingCountry ?? 'Canada';

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!item) return;

    const required = [
      { key: 'billingLegalName' as const, label: 'Nom de facturation' },
      { key: 'billingEmail' as const, label: 'Courriel de facturation' },
      { key: 'billingAddressLine1' as const, label: 'Adresse' },
      { key: 'billingCity' as const, label: 'Ville' },
      { key: 'billingState' as const, label: 'Province / Etat' },
      { key: 'billingPostalCode' as const, label: 'Code postal' },
      { key: 'billingCountry' as const, label: 'Pays' },
    ];
    for (const field of required) {
      if (!item[field.key]?.trim()) {
        setError(`Le champ "${field.label}" est requis.`);
        return;
      }
    }

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
      setSuccess('Informations enregistrées. Merci, nous pouvons maintenant préparer votre facture !');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
            <p className="text-sm text-slate-300">Chargement en cours...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !item) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-red-700/50 bg-red-950/30 p-6 text-red-200 sm:p-8">
          <p className="text-base font-semibold">Lien invalide ou expiré</p>
          <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-slate-900/60">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Nowis - Facturation</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Complétez vos informations de facturation
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300">
            Bonjour <strong className="text-white">{item?.fullName}</strong>, merci de remplir les champs ci-dessous.
            Ces informations apparaîtront sur votre facture. Les champs marqués <span className="font-bold text-amber-400">*</span> sont obligatoires.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {success ? (
          <div className="mb-6 rounded-2xl border border-emerald-600/40 bg-emerald-950/30 px-5 py-4 text-emerald-200">
            <p className="text-base font-semibold">Enregistré</p>
            <p className="mt-1 text-sm">{success}</p>
          </div>
        ) : null}

        <form onSubmit={save} className="space-y-6">
          <Section title="Votre compte">
            <Field label="Nom complet">
              <input value={item?.fullName || ''} disabled className={disabledInputClass} />
              <p className="mt-1.5 text-xs text-slate-500">Ce champ correspond à votre nom de compte et ne peut pas être modifié ici.</p>
            </Field>
          </Section>

          <Section title="Coordonnées de facturation">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom de facturation" required>
                <input
                  value={legalName}
                  onChange={(e) => update('billingLegalName', e.target.value)}
                  placeholder={item?.fullName ?? ''}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label="Société / organisme">
                <input
                  value={item?.billingCompanyName ?? ''}
                  onChange={(e) => update('billingCompanyName', e.target.value)}
                  placeholder="Facultatif"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Courriel de facturation" required>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => update('billingEmail', e.target.value)}
                  placeholder="votre@courriel.com"
                  className={inputClass}
                  required
                />
              </Field>
              <Field label="Téléphone">
                <input
                  value={item?.billingPhone ?? ''}
                  onChange={(e) => update('billingPhone', e.target.value)}
                  placeholder="819 000-0000"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Adresse de facturation">
            <Field label="Adresse" required>
              <input
                value={item?.billingAddressLine1 ?? ''}
                onChange={(e) => update('billingAddressLine1', e.target.value)}
                placeholder="123 Rue Principale"
                className={inputClass}
                required
              />
            </Field>
            <Field label="Appartement, bureau, suite...">
              <input
                value={item?.billingAddressLine2 ?? ''}
                onChange={(e) => update('billingAddressLine2', e.target.value)}
                placeholder="App. 4 (facultatif)"
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Ville" required>
                <input
                  value={item?.billingCity ?? ''}
                  onChange={(e) => update('billingCity', e.target.value)}
                  placeholder="Drummondville"
                  className={inputClass}
                  required
                />
              </Field>
              <Field label="Province / État" required>
                <input
                  value={item?.billingState ?? ''}
                  onChange={(e) => update('billingState', e.target.value)}
                  placeholder="Québec"
                  className={inputClass}
                  required
                />
              </Field>
              <Field label="Code postal" required>
                <input
                  value={item?.billingPostalCode ?? ''}
                  onChange={(e) => update('billingPostalCode', e.target.value)}
                  placeholder="J2A 2G2"
                  className={inputClass}
                  required
                />
              </Field>
            </div>
            <Field label="Pays" required>
              <input
                value={country}
                onChange={(e) => update('billingCountry', e.target.value)}
                placeholder="Canada"
                className={inputClass}
                required
              />
            </Field>
          </Section>

          <Section title="Autre">
            <Field label="Numéro de TPS / TVQ (si applicable)">
              <input
                value={item?.billingTaxId ?? ''}
                onChange={(e) => update('billingTaxId', e.target.value)}
                placeholder="Facultatif"
                className={inputClass}
              />
            </Field>
            <Field label="Note ou commentaire">
              <textarea
                value={item?.billingNotes ?? ''}
                onChange={(e) => update('billingNotes', e.target.value)}
                rows={3}
                placeholder="Informations supplémentaires pour la facturation..."
                className={`${inputClass} resize-none`}
              />
            </Field>
          </Section>

          {error ? (
            <div className="rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder mes informations'}
            </button>
            <p className="text-xs text-slate-500">Ces données servent à préparer vos factures et documents officiels.</p>
          </div>
        </form>
      </div>
    </main>
  );
}
