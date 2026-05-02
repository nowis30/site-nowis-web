'use client';

import { useEffect, useMemo, useState } from 'react';
import { workshopSelectLgClassName } from '@/components/forms/select-styles';

type OptionItem = { id: string; label: string };

type ApiOptionItem = { id: string; fullName?: string; name?: string };

type RichOrganization = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  primaryContact?: {
    id?: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

function toNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function money(value: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

export function CrmWorkshopCreateForm() {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const [contacts, setContacts] = useState<OptionItem[]>([]);
  const [organizations, setOrganizations] = useState<OptionItem[]>([]);
  const [organizationsData, setOrganizationsData] = useState<RichOrganization[]>([]);

  const [form, setForm] = useState({
    workshopType: 'ORGANIZATION',
    title: '',
    clientId: '',
    organizationId: '',
    organizationName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    addressOrLocation: '',
    deliveryFormat: 'SUR_PLACE',
    participantEstimate: '',
    targetAudience: 'PERSONNES_AGEES',
    durationPreset: 'M90',
    durationCustomMinutes: '',
    pricingMode: 'HORAIRE',
    basePrice: '120',
    discountPercent: '',
    internalNotes: '',
    clientNotes: '',
    status: 'EN_ATTENTE_RDV',
  });

  const [generatedLinks, setGeneratedLinks] = useState({
    bookingUrl: '',
    workshopPublicUrl: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/crm/options', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Impossible de charger les options');

        setContacts(
          ((data.contacts || []) as ApiOptionItem[]).map((item) => ({
            id: item.id,
            label: item.fullName || item.name || 'Contact',
          })),
        );

        const richOrgs = (data.organizations || []) as RichOrganization[];
        setOrganizationsData(richOrgs);
        setOrganizations(
          richOrgs.map((item) => ({
            id: item.id,
            label: item.name || 'Organisation',
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger les options');
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  const finalPricePreview = useMemo(() => {
    const basePrice = toNumber(form.basePrice) ?? 0;
    const participants = Math.max(1, toNumber(form.participantEstimate) ?? 1);
    const discount = Math.min(100, Math.max(0, toNumber(form.discountPercent) ?? 0));
    const subtotal = form.pricingMode === 'PAR_PERSONNE' ? basePrice * participants : basePrice;
    return subtotal * (1 - discount / 100);
  }, [form.basePrice, form.discountPercent, form.participantEstimate, form.pricingMode]);

  async function handleCopy(value: string, label: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copié.`);
    } catch {
      setCopyStatus(`Impossible de copier ${label.toLowerCase()}.`);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCopyStatus(null);
    setSaving(true);

    const payload = {
      workshopType: form.workshopType,
      title: form.title,
      clientId: form.clientId,
      organizationId: form.organizationId,
      organizationName: form.organizationName,
      contactPerson: form.contactPerson,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail,
      addressOrLocation: form.addressOrLocation,
      deliveryFormat: form.deliveryFormat,
      participantEstimate: toNumber(form.participantEstimate),
      targetAudience: form.targetAudience,
      durationPreset: form.durationPreset,
      durationCustomMinutes: toNumber(form.durationCustomMinutes),
      pricingMode: form.pricingMode,
      basePrice: toNumber(form.basePrice),
      discountPercent: toNumber(form.discountPercent),
      internalNotes: form.internalNotes,
      clientNotes: form.clientNotes,
      status: form.status,
      preferredDays: [],
      format: form.deliveryFormat === 'SUR_PLACE' ? 'IN_PERSON' : form.deliveryFormat === 'EN_LIGNE' ? 'VIRTUAL' : 'HYBRID',
      workshopTheme: form.title,
      objectives: form.clientNotes || 'Atelier cree depuis le CRM admin.',
      notes: form.internalNotes,
    };

    try {
      const response = await fetch('/api/crm/workshop-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Enregistrement impossible');
      }

      setGeneratedLinks({
        bookingUrl: data.bookingUrl || '',
        workshopPublicUrl: data.workshopPublicUrl || '',
      });
      setSuccess('Atelier enregistré. Le lien de rendez-vous est prêt.');
      setForm((current) => ({
        ...current,
        title: '',
        internalNotes: '',
        clientNotes: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h2 className="text-2xl font-semibold text-white">Créer un atelier</h2>
        <p className="mt-2 text-sm text-slate-300">Formulaire simplifié pour organisation ou client individuel.</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">1. Type de dossier</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setForm((current) => ({ ...current, workshopType: 'ORGANIZATION' }))} className={`min-h-[58px] rounded-2xl border px-4 text-lg font-semibold ${form.workshopType === 'ORGANIZATION' ? 'border-primary-400 bg-primary-500/20 text-white' : 'border-slate-700 bg-slate-950/60 text-slate-200'}`}>
            Organisation
          </button>
          <button type="button" onClick={() => setForm((current) => ({ ...current, workshopType: 'CLIENT' }))} className={`min-h-[58px] rounded-2xl border px-4 text-lg font-semibold ${form.workshopType === 'CLIENT' ? 'border-primary-400 bg-primary-500/20 text-white' : 'border-slate-700 bg-slate-950/60 text-slate-200'}`}>
            Client individuel
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">2. Personne et organisation</h3>
        {loadingOptions ? <p className="mt-3 text-sm text-slate-400">Chargement des contacts...</p> : null}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Titre atelier</span>
            <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Client existant (optionnel)</span>
            <select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} className={workshopSelectLgClassName}>
              <option value="">Sélectionner</option>
              {contacts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Organisation existante (optionnel)</span>
            <select
              value={form.organizationId}
              onChange={(event) => {
                const orgId = event.target.value;
                const org = organizationsData.find((item) => item.id === orgId);
                setForm((current) => {
                  const next = { ...current, organizationId: orgId };
                  if (!org) return next;
                  // Auto-remplissage: on ne remplace que les champs vides
                  if (!current.organizationName && org.name) next.organizationName = org.name;
                  if (!current.contactPerson && org.primaryContact?.fullName) next.contactPerson = org.primaryContact.fullName;
                  const phone = org.phone || org.primaryContact?.phone || '';
                  if (!current.contactPhone && phone) next.contactPhone = phone;
                  const email = org.email || org.primaryContact?.email || '';
                  if (!current.contactEmail && email) next.contactEmail = email;
                  const address = [org.address, org.city].filter(Boolean).join(', ');
                  if (!current.addressOrLocation && address) next.addressOrLocation = address;
                  if (current.workshopType !== 'ORGANIZATION') next.workshopType = 'ORGANIZATION';
                  return next;
                });
              }}
              className={workshopSelectLgClassName}
            >
              <option value="">Sélectionner</option>
              {organizations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Organisation manuelle</span>
            <input value={form.organizationName} onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Personne contact</span>
            <input value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Téléphone</span>
            <input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-200">Courriel</span>
            <input type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">3. Paramètres atelier</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Format</span>
            <select value={form.deliveryFormat} onChange={(event) => setForm((current) => ({ ...current, deliveryFormat: event.target.value }))} className={workshopSelectLgClassName}>
              <option value="SUR_PLACE">Sur place</option>
              <option value="EN_LIGNE">En ligne</option>
              <option value="A_DETERMINER">À déterminer</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Adresse / lieu</span>
            <input value={form.addressOrLocation} onChange={(event) => setForm((current) => ({ ...current, addressOrLocation: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Participants approximatifs</span>
            <input type="number" min={1} value={form.participantEstimate} onChange={(event) => setForm((current) => ({ ...current, participantEstimate: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Public cible</span>
            <select value={form.targetAudience} onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))} className={workshopSelectLgClassName}>
              <option value="PERSONNES_AGEES">Personnes âgées</option>
              <option value="JEUNES">Jeunes</option>
              <option value="ADULTES">Adultes</option>
              <option value="FAMILLE">Famille</option>
              <option value="ORGANISME">Organisme</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Durée prévue</span>
            <select value={form.durationPreset} onChange={(event) => setForm((current) => ({ ...current, durationPreset: event.target.value }))} className={workshopSelectLgClassName}>
              <option value="M60">60 minutes</option>
              <option value="M90">90 minutes</option>
              <option value="M120">120 minutes</option>
              <option value="PERSONNALISE">Personnalisé</option>
            </select>
          </label>
          {form.durationPreset === 'PERSONNALISE' ? (
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-200">Durée personnalisée (minutes)</span>
              <input type="number" min={1} value={form.durationCustomMinutes} onChange={(event) => setForm((current) => ({ ...current, durationCustomMinutes: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
            </label>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">4. Prix</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Mode de tarif</span>
            <select value={form.pricingMode} onChange={(event) => setForm((current) => ({ ...current, pricingMode: event.target.value }))} className={workshopSelectLgClassName}>
              <option value="HORAIRE">120 $/h</option>
              <option value="PAR_PERSONNE">10 $/personne</option>
              <option value="PERSONNALISE">Prix personnalisé</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Tarif de base</span>
            <input type="number" min={0} step="0.01" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Rabais (%)</span>
            <input type="number" min={0} max={100} step="0.01" value={form.discountPercent} onChange={(event) => setForm((current) => ({ ...current, discountPercent: event.target.value }))} className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-base text-white" />
          </label>
          <div className="rounded-2xl border border-primary-500/40 bg-primary-500/10 p-4">
            <p className="text-sm text-primary-100">Prix final estimé</p>
            <p className="mt-1 text-3xl font-bold text-white">{money(finalPricePreview)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">5. Notes</h3>
        <div className="mt-3 grid gap-4">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Notes internes (admin)</span>
            <textarea rows={4} value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-200">Notes visibles client</span>
            <textarea rows={3} value={form.clientNotes} onChange={(event) => setForm((current) => ({ ...current, clientNotes: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white" />
          </label>
        </div>
      </section>

      {error ? <p className="rounded-2xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-base text-red-200">{error}</p> : null}
      {success ? <p className="rounded-2xl border border-emerald-700/60 bg-emerald-950/30 px-4 py-3 text-base text-emerald-100">{success}</p> : null}
      {copyStatus ? <p className="text-sm text-slate-300">{copyStatus}</p> : null}

      {generatedLinks.bookingUrl || generatedLinks.workshopPublicUrl ? (
        <section className="rounded-3xl border border-primary-500/30 bg-primary-500/10 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white">Liens prêts</h3>
          {generatedLinks.bookingUrl ? (
            <div className="mt-3 rounded-2xl bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">Lien Calendly/booking</p>
              <p className="mt-1 break-all text-sm text-white">{generatedLinks.bookingUrl}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void handleCopy(generatedLinks.bookingUrl, 'Lien de planification')} className="min-h-[48px] rounded-xl border border-slate-600 px-4 text-sm font-semibold text-white">Copier</button>
                <a href={generatedLinks.bookingUrl} target="_blank" rel="noreferrer" className="min-h-[48px] rounded-xl bg-primary-600 px-4 text-sm font-semibold leading-[48px] text-white">Ouvrir</a>
              </div>
            </div>
          ) : null}

          {generatedLinks.workshopPublicUrl ? (
            <div className="mt-3 rounded-2xl bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">Lien client atelier</p>
              <p className="mt-1 break-all text-sm text-white">{generatedLinks.workshopPublicUrl}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void handleCopy(generatedLinks.workshopPublicUrl, 'Lien client')} className="min-h-[48px] rounded-xl border border-slate-600 px-4 text-sm font-semibold text-white">Copier</button>
                <a href={generatedLinks.workshopPublicUrl} target="_blank" rel="noreferrer" className="min-h-[48px] rounded-xl bg-primary-600 px-4 text-sm font-semibold leading-[48px] text-white">Voir la page</a>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="sticky bottom-3 z-10">
        <button type="submit" disabled={saving} className="min-h-[64px] w-full rounded-2xl bg-primary-600 px-6 text-xl font-bold text-white shadow-xl shadow-black/20 disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Sauvegarder l\'atelier'}
        </button>
      </div>
    </form>
  );
}
