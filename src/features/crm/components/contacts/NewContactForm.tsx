'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const fields = [
  ['fullName', 'Nom du contact', 160],
  ['email', 'Courriel', 254],
  ['phone', 'Téléphone', 40],
  ['companyName', 'Entreprise', 160],
  ['billingEmail', 'Courriel de facturation', 254],
  ['billingAddressLine1', 'Adresse de facturation', 240],
  ['billingCity', 'Ville', 120],
  ['billingState', 'Province / région', 120],
  ['billingPostalCode', 'Code postal', 40],
  ['billingCountry', 'Pays', 120],
] as const;

export function NewContactForm({ organizations }: { organizations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value).trim()]));
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, type: 'CLIENT', tags: [] }),
      });
      const data = await response.json() as { item?: { id: string }; error?: string };
      if (!response.ok || !data.item?.id) throw new Error(data.error || 'Création impossible');
      router.push(`/crm/contacts/${data.item.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Création impossible');
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Nouveau contact client</h1>
        <Link href="/crm/contacts" className="text-sm text-primary-300">Retour aux contacts</Link>
      </div>
      <p className="text-sm text-slate-400">Créez d’abord l’organisation si vous souhaitez facturer l’entreprise.</p>
      <Link href="/crm/organizations/nouveau" className="inline-block text-sm text-primary-300">Créer une organisation</Link>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, maxLength]) => (
            <label key={name} className="block text-sm text-slate-300">
              {label}{name === 'fullName' ? ' *' : ''}
              <input name={name} required={name === 'fullName'} minLength={name === 'fullName' ? 2 : undefined}
                maxLength={maxLength} type={name.toLowerCase().includes('email') ? 'email' : name === 'phone' ? 'tel' : 'text'}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
            </label>
          ))}
          <label className="block text-sm text-slate-300">Organisation liée
            <select name="organizationId" className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
              <option value="">Aucune organisation</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </label>
          <label className="block text-sm text-slate-300">Notes
            <textarea name="notes" maxLength={5000} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
          </label>
        </fieldset>
        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
        <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? 'Création…' : 'Créer le contact'}
        </button>
      </form>
    </section>
  );
}
