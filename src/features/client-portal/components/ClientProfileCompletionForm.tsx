'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClientAddressFields, ClientRequestType } from '@/features/client-portal/profile';

interface ClientProfileCompletionFormProps {
  initial: {
    phone: string;
    billingAddress: ClientAddressFields;
    requestPostalAddress: ClientAddressFields;
    samePostalAsBilling: boolean;
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

        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <p className="mb-3 text-sm font-medium text-white">Adresse de facturation</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs text-slate-300">Numero</span>
              <input
                value={form.billingAddress.streetNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    billingAddress: { ...current.billingAddress, streetNumber: event.target.value },
                    requestPostalAddress: current.samePostalAsBilling
                      ? { ...current.requestPostalAddress, streetNumber: event.target.value }
                      : current.requestPostalAddress,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-300">Rue</span>
              <input
                value={form.billingAddress.street}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    billingAddress: { ...current.billingAddress, street: event.target.value },
                    requestPostalAddress: current.samePostalAsBilling
                      ? { ...current.requestPostalAddress, street: event.target.value }
                      : current.requestPostalAddress,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-300">Ville</span>
              <input
                value={form.billingAddress.city}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    billingAddress: { ...current.billingAddress, city: event.target.value },
                    requestPostalAddress: current.samePostalAsBilling
                      ? { ...current.requestPostalAddress, city: event.target.value }
                      : current.requestPostalAddress,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-300">Code postal</span>
              <input
                value={form.billingAddress.postalCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    billingAddress: { ...current.billingAddress, postalCode: event.target.value },
                    requestPostalAddress: current.samePostalAsBilling
                      ? { ...current.requestPostalAddress, postalCode: event.target.value }
                      : current.requestPostalAddress,
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
            </label>
          </div>
        </div>

        <label className="md:col-span-2 inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.samePostalAsBilling}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                samePostalAsBilling: event.target.checked,
                requestPostalAddress: event.target.checked ? { ...current.billingAddress } : current.requestPostalAddress,
              }))
            }
          />
          Meme adresse postale que facturation
        </label>

        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <p className="mb-3 text-sm font-medium text-white">Adresse postale de la demande (atelier/chanson)</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs text-slate-300">Numero</span>
              <input
                value={form.requestPostalAddress.streetNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestPostalAddress: { ...current.requestPostalAddress, streetNumber: event.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white disabled:opacity-60"
                required
                disabled={form.samePostalAsBilling}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-300">Rue</span>
              <input
                value={form.requestPostalAddress.street}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestPostalAddress: { ...current.requestPostalAddress, street: event.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white disabled:opacity-60"
                required
                disabled={form.samePostalAsBilling}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-300">Ville</span>
              <input
                value={form.requestPostalAddress.city}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestPostalAddress: { ...current.requestPostalAddress, city: event.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white disabled:opacity-60"
                required
                disabled={form.samePostalAsBilling}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-slate-300">Code postal</span>
              <input
                value={form.requestPostalAddress.postalCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestPostalAddress: { ...current.requestPostalAddress, postalCode: event.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white disabled:opacity-60"
                required
                disabled={form.samePostalAsBilling}
              />
            </label>
          </div>
        </div>
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
