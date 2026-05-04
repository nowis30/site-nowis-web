'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import type { ContactWorkspaceContact } from './types';

const CONTACT_TYPE_OPTIONS = [
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'PARTENAIRE', label: 'Partenaire' },
  { value: 'ORGANIZATION', label: 'Organisation' },
  { value: 'PARTICIPANT', label: 'Participant' },
] as const;

interface FormState {
  type: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  billingCompanyName: string;
  billingLegalName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  billingTaxId: string;
  billingNotes: string;
  source: string;
  tags: string; // virgule-séparés
  notes: string;
}

function buildInitialForm(contact: ContactWorkspaceContact): FormState {
  return {
    type: contact.type,
    fullName: contact.fullName,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    companyName: contact.companyName ?? '',
    billingCompanyName: contact.billingCompanyName ?? '',
    billingLegalName: contact.billingLegalName ?? '',
    billingEmail: contact.billingEmail ?? '',
    billingPhone: contact.billingPhone ?? '',
    billingAddressLine1: contact.billingAddressLine1 ?? '',
    billingAddressLine2: contact.billingAddressLine2 ?? '',
    billingCity: contact.billingCity ?? '',
    billingState: contact.billingState ?? '',
    billingPostalCode: contact.billingPostalCode ?? '',
    billingCountry: contact.billingCountry ?? '',
    billingTaxId: contact.billingTaxId ?? '',
    billingNotes: contact.billingNotes ?? '',
    source: contact.source ?? '',
    tags: contact.tags.join(', '),
    notes: contact.notes ?? '',
  };
}

export function ContactEditModal({
  contact,
  onClose,
  onSaved,
}: {
  contact: ContactWorkspaceContact;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialForm(contact));
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

    const tags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      const response = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          companyName: form.companyName || undefined,
          billingCompanyName: form.billingCompanyName || undefined,
          billingLegalName: form.billingLegalName || undefined,
          billingEmail: form.billingEmail || undefined,
          billingPhone: form.billingPhone || undefined,
          billingAddressLine1: form.billingAddressLine1 || undefined,
          billingAddressLine2: form.billingAddressLine2 || undefined,
          billingCity: form.billingCity || undefined,
          billingState: form.billingState || undefined,
          billingPostalCode: form.billingPostalCode || undefined,
          billingCountry: form.billingCountry || undefined,
          billingTaxId: form.billingTaxId || undefined,
          billingNotes: form.billingNotes || undefined,
          source: form.source || undefined,
          tags,
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || 'Enregistrement impossible');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        onSaved();
      }, 900);
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
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CRM — Fiche contact</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Modifier la fiche</h3>
            <p className="mt-1 text-sm text-slate-400">{contact.fullName}</p>
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

        {/* Champs */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Nom complet <span className="text-red-400">*</span></span>
            <input
              required
              minLength={2}
              maxLength={160}
              value={form.fullName}
              onChange={(event) => setField('fullName', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Prénom Nom"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Type</span>
            <select
              value={form.type}
              onChange={(event) => setField('type', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              {CONTACT_TYPE_OPTIONS.map((item) => (
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
              placeholder="exemple@domaine.com"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Téléphone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="514 000-0000"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Entreprise / Organisation</span>
            <input
              value={form.companyName}
              onChange={(event) => setField('companyName', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Nom de l'entreprise"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Société facturation</span>
            <input
              value={form.billingCompanyName}
              onChange={(event) => setField('billingCompanyName', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Nom société sur la facture"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Nom légal facturation</span>
            <input
              value={form.billingLegalName}
              onChange={(event) => setField('billingLegalName', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Nom légal"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Courriel facturation</span>
            <input
              type="email"
              value={form.billingEmail}
              onChange={(event) => setField('billingEmail', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="facturation@..."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Téléphone facturation</span>
            <input
              type="tel"
              value={form.billingPhone}
              onChange={(event) => setField('billingPhone', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="514 000-0000"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Adresse facturation ligne 1</span>
            <input
              value={form.billingAddressLine1}
              onChange={(event) => setField('billingAddressLine1', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Adresse"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Adresse facturation ligne 2</span>
            <input
              value={form.billingAddressLine2}
              onChange={(event) => setField('billingAddressLine2', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Appartement, bureau..."
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Ville facturation</span>
            <input
              value={form.billingCity}
              onChange={(event) => setField('billingCity', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Ville"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Province/Etat</span>
            <input
              value={form.billingState}
              onChange={(event) => setField('billingState', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="QC"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Code postal facturation</span>
            <input
              value={form.billingPostalCode}
              onChange={(event) => setField('billingPostalCode', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="H0H 0H0"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Pays facturation</span>
            <input
              value={form.billingCountry}
              onChange={(event) => setField('billingCountry', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Canada"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Numéro taxe</span>
            <input
              value={form.billingTaxId}
              onChange={(event) => setField('billingTaxId', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="TPS/TVQ"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Notes facturation</span>
            <textarea
              rows={3}
              value={form.billingNotes}
              onChange={(event) => setField('billingNotes', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Infos de facturation client"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">Source</span>
            <input
              value={form.source}
              onChange={(event) => setField('source', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Instagram, bouche-à-oreille…"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Tags <span className="text-xs text-slate-500">(séparés par des virgules)</span></span>
            <input
              value={form.tags}
              onChange={(event) => setField('tags', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="vip, atelier, suivi"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Notes internes</span>
            <textarea
              rows={5}
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              placeholder="Informations utiles pour l'équipe…"
            />
          </label>
        </div>

        {/* Messages */}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            ✓ Fiche sauvegardée avec succès.
          </p>
        ) : null}

        {/* Actions */}
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
