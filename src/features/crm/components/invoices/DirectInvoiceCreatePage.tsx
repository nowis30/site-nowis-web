'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Building2, FilePlus2, Plus, Trash2, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buildRentalInvoiceDescription, buildTimeInvoiceDescription, timeInvoiceLineAmount } from '@/lib/invoice-lines';
import { roundMoney, splitConsumptionTaxes } from '@/lib/quebec-fiscal';

type ContactOption = {
  id: string;
  fullName: string;
  companyName?: string | null;
};

type OrganizationOption = {
  id: string;
  name: string;
  city?: string | null;
};

type DraftLine = {
  id: string;
  tenantName: string;
  rentalLabel: string;
  amount: number;
  description: string;
  hours: number;
  hourlyRate: number;
};

interface DirectInvoiceCreatePageProps {
  contacts: ContactOption[];
  organizations: OrganizationOption[];
  taxSettings?: {
    profileTaxesEnabled: boolean;
    taxesEnabled: boolean;
    gst: number;
    qst: number;
  };
  initialForm?: {
    organizationId?: string;
    contactId?: string;
    description?: string;
    amount?: string;
    sourceWorkshopRequestId?: string;
    sourceSongRequestId?: string;
  } | null;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return toDateInputValue(date);
}

function money(value: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

export function DirectInvoiceCreatePage({ contacts, organizations, taxSettings, initialForm }: DirectInvoiceCreatePageProps) {
  const router = useRouter();
  const initialRecipientType: 'organization' | 'contact' =
    initialForm?.contactId && !initialForm?.organizationId ? 'contact' : organizations.length > 0 ? 'organization' : 'contact';
  const [invoiceMode, setInvoiceMode] = useState<'time' | 'rental'>('time');
  const initialAmount = Number(initialForm?.amount || 500);
  const [recipientType, setRecipientType] = useState<'organization' | 'contact'>(initialRecipientType);
  const [organizationId, setOrganizationId] = useState(initialForm?.organizationId || '');
  const [contactId, setContactId] = useState(initialForm?.contactId || '');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [lines, setLines] = useState<DraftLine[]>([
    {
      id: 'line-1',
      description: initialForm?.description || '',
      hours: 1,
      hourlyRate: initialForm?.amount && Number.isFinite(initialAmount) && initialAmount > 0 ? initialAmount : 0,
      tenantName: '',
      rentalLabel: initialForm?.description || '',
      amount: Number.isFinite(initialAmount) && initialAmount > 0 ? initialAmount : 500,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(
    () => Math.round(lines.reduce((sum, line) => {
      if (invoiceMode === 'rental') return sum + Math.max(0, Number(line.amount) || 0);
      try { return sum + timeInvoiceLineAmount(line); } catch { return sum; }
    }, 0) * 100) / 100,
    [lines, invoiceMode],
  );
  const priced = useMemo(() => {
    if (!taxSettings?.taxesEnabled) return { subtotal: total, gstAmount: 0, qstAmount: 0, taxAmount: 0, total };
    const split = splitConsumptionTaxes(total, taxSettings.gst, taxSettings.qst);
    return { subtotal: total, ...split, total: roundMoney(total + split.taxAmount) };
  }, [taxSettings, total]);

  function updateLine(id: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    if (invoiceMode === 'time' && lines.length >= 10) return;
    setLines((current) => [
      ...current,
      {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `line-${current.length + 1}`,
        description: '',
        hours: 1,
        hourlyRate: 0,
        tenantName: '',
        rentalLabel: '',
        amount: 500,
      },
    ]);
  }

  function removeLine(id: string) {
    setLines((current) => (current.length <= 1 ? current : current.filter((line) => line.id !== id)));
  }

  async function createInvoice() {
    if (saving) return;
    setError('');

    if (recipientType === 'organization' && !organizationId) {
      setError("Choisis l'organisation à facturer.");
      return;
    }
    if (recipientType === 'contact' && !contactId) {
      setError('Choisis le contact à facturer.');
      return;
    }
    if (!dueDate) {
      setError("Choisis une date d'échéance.");
      return;
    }
    if (invoiceMode === 'rental' && lines.some((line) => !line.tenantName.trim() || !line.rentalLabel.trim())) {
      setError('Entre le nom du locataire et le logement pour chaque ligne.');
      return;
    }
    if (invoiceMode === 'rental' && lines.some((line) => !Number.isFinite(Number(line.amount)) || Number(line.amount) <= 0)) {
      setError('Chaque logement doit avoir un montant supérieur à 0 $.');
      return;
    }
    let description: string;
    try {
      if (invoiceMode === 'time' && lines.length > 10) throw new Error('Une facture de temps peut contenir au maximum 10 prestations.');
      description = invoiceMode === 'time'
        ? buildTimeInvoiceDescription(lines)
        : buildRentalInvoiceDescription(lines);
      if (description.length > 2000) throw new Error('La description dépasse 2 000 caractères. Réduis le nombre de lignes ou leur texte.');
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Prestations invalides.');
      return;
    }
    if (total <= 0) {
      setError('Le total de la facture doit être supérieur à 0 $.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/crm/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(recipientType === 'organization' ? { organizationId } : { contactId }),
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
          amount: total,
          status: 'DRAFT',
          description,
          sourceWorkshopRequestId: initialForm?.sourceWorkshopRequestId,
          sourceSongRequestId: initialForm?.sourceSongRequestId,
        }),
      });
      const data = await response.json().catch(() => null) as { item?: { id: string; number: string }; error?: string } | null;
      if (!response.ok || !data?.item?.id) {
        setError(data?.error || 'Impossible de créer la facture.');
        return;
      }

      router.push(`/crm/invoices/${data.item.id}`);
      router.refresh();
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Impossible de créer la facture.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/crm/invoices"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={15} className="mr-1 inline" /> Factures
          </Link>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <FilePlus2 size={22} /> Nouvelle facture
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">Facture une organisation ou un contact directement, sans soumission.</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-500/30 bg-primary-950/20 px-4 py-3 sm:text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total à payer</p>
          <p className="text-2xl font-bold text-white">{money(priced.total)}</p>
          {priced.taxAmount > 0 ? (
            <p className="mt-1 text-xs leading-5 text-slate-400">Hors taxes {money(priced.subtotal)} · TPS {money(priced.gstAmount)} · TVQ {money(priced.qstAmount)}</p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-slate-400">{taxSettings?.profileTaxesEnabled ? 'Numéros TPS/TVQ manquants : aucune taxe ajoutée.' : 'Montant hors taxes. Les taxes sont désactivées.'}</p>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Facturé à</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-1.5">
              <button
                type="button"
                onClick={() => setRecipientType('organization')}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${recipientType === 'organization' ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Building2 size={15} /> Organisation
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('contact')}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${recipientType === 'contact' ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <UserRound size={15} /> Contact
              </button>
            </div>
          </div>

          {recipientType === 'organization' ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Organisation</label>
              <select
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                <option value="">Choisir une organisation</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.city ? `${organization.name} — ${organization.city}` : organization.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-emerald-300/80">
                Le CRM utilisera les coordonnées de facturation de l'organisation. Aucun contact manuel n'est requis.
              </p>
              <Link href="/crm/organizations/nouveau" className="mt-2 inline-block text-xs text-primary-300">Créer une organisation</Link>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Contact</label>
              <select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                <option value="">Choisir un contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.companyName ? `${contact.companyName} — ${contact.fullName}` : contact.fullName}
                  </option>
                ))}
              </select>
              <Link href="/crm/contacts/nouveau" className="mt-2 inline-block text-xs text-primary-300">Créer un contact</Link>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Échéance</label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-sm text-white"
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">
            La facture sera créée en <strong className="text-slate-200">brouillon</strong>. Tu pourras ensuite l'imprimer, l'enregistrer en PDF ou l'envoyer par courriel depuis sa page.
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{invoiceMode === 'time' ? 'Temps travaillé' : 'Logements loués'}</h3>
              <p className="text-xs text-slate-400">{invoiceMode === 'time' ? 'Ajoute les heures et le tarif de chaque prestation (10 maximum).' : 'Tu peux mettre plusieurs locations sur la même facture.'}</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              disabled={saving || (invoiceMode === 'time' && lines.length >= 10)}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-500/40 px-3 py-2 text-xs font-semibold text-primary-200 hover:bg-primary-950/40"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>

          <label className="block text-sm text-slate-300">Type de facture
            <select value={invoiceMode} onChange={(event) => setInvoiceMode(event.target.value as 'time' | 'rental')}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
              <option value="time">Temps travaillé (heures × tarif)</option>
              <option value="rental">Logements loués</option>
            </select>
          </label>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <article key={line.id} className="rounded-xl border border-slate-700 bg-slate-950/55 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{invoiceMode === 'time' ? 'Prestation' : 'Location'} {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 1}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-red-950/30 hover:text-red-300 disabled:opacity-30"
                    aria-label={`Supprimer la ligne ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {invoiceMode === 'time' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-400 sm:col-span-2">Description de la prestation
                      <input value={line.description} maxLength={500} onChange={(event) => updateLine(line.id, { description: event.target.value })}
                        placeholder="Ex. Gestion du site — du 1 au 15 octobre"
                        className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs text-slate-400">Heures
                      <input type="number" min="0.01" max="100000" step="0.01" value={line.hours || ''}
                        onChange={(event) => updateLine(line.id, { hours: Number(event.target.value) })}
                        className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs text-slate-400">Tarif horaire ($/h)
                      <input type="number" min="0.01" max="100000" step="0.01" value={line.hourlyRate || ''}
                        onChange={(event) => updateLine(line.id, { hourlyRate: Number(event.target.value) })}
                        className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white" />
                    </label>
                  </div>
                ) : <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Nom du locataire</label>
                    <input
                      value={line.tenantName}
                      onChange={(event) => updateLine(line.id, { tenantName: event.target.value })}
                      placeholder="Ex. Jean Tremblay"
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Logement / adresse</label>
                    <input
                      value={line.rentalLabel}
                      onChange={(event) => updateLine(line.id, { rentalLabel: event.target.value })}
                      placeholder="Ex. 123 rue Exemple, app. 4"
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px] sm:items-end">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Montants rapides</p>
                    <div className="flex flex-wrap gap-2">
                      {[500, 600, 700].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateLine(line.id, { amount: value })}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${line.amount === value ? 'border-primary-400 bg-primary-600 text-white' : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-slate-500'}`}
                        >
                          {value} $
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Montant ajustable</label>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      step="25"
                      value={line.amount}
                      onChange={(event) => updateLine(line.id, { amount: Number(event.target.value) })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-right text-sm font-semibold text-white"
                    />
                  </div>
                </div>
                </>}
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total de la facture</p>
              <p className="text-2xl font-bold text-white">{money(total)}</p>
            </div>
            <button
              type="button"
              onClick={() => void createInvoice()}
              disabled={saving}
              className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

