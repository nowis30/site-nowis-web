'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, FilePlus2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buildRentalInvoiceDescription } from '@/lib/invoice-lines';

type ContactOption = {
  id: string;
  fullName: string;
  companyName?: string | null;
};

type DraftLine = {
  id: string;
  tenantName: string;
  rentalLabel: string;
  amount: number;
};

interface DirectInvoiceCreatePageProps {
  contacts: ContactOption[];
  initialForm?: {
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

export function DirectInvoiceCreatePage({ contacts, initialForm }: DirectInvoiceCreatePageProps) {
  const router = useRouter();
  const suggestedGestionIsr = contacts.find((contact) => /gestion\s*isr/i.test(`${contact.fullName} ${contact.companyName || ''}`));
  const initialAmount = Number(initialForm?.amount || 500);
  const [contactId, setContactId] = useState(initialForm?.contactId || suggestedGestionIsr?.id || '');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [lines, setLines] = useState<DraftLine[]>([
    {
      id: 'line-1',
      tenantName: '',
      rentalLabel: initialForm?.description || '',
      amount: Number.isFinite(initialAmount) && initialAmount > 0 ? initialAmount : 500,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + Math.max(0, Number(line.amount) || 0), 0),
    [lines],
  );

  function updateLine(id: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `line-${current.length + 1}`,
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
    setError('');

    if (!contactId) {
      setError('Choisis le client à facturer, par exemple Gestion ISR.');
      return;
    }
    if (!dueDate) {
      setError("Choisis une date d'échéance.");
      return;
    }
    if (lines.some((line) => !line.tenantName.trim() || !line.rentalLabel.trim())) {
      setError('Entre le nom du locataire et le logement pour chaque ligne.');
      return;
    }
    if (lines.some((line) => !Number.isFinite(Number(line.amount)) || Number(line.amount) <= 0)) {
      setError('Chaque logement doit avoir un montant supérieur à 0 $.');
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
          contactId,
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
          amount: total,
          status: 'DRAFT',
          description: buildRentalInvoiceDescription(lines.map((line) => ({
            tenantName: line.tenantName,
            rentalLabel: line.rentalLabel,
            amount: line.amount,
          }))),
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
            <p className="mt-0.5 text-sm text-slate-400">Crée une facture directement, sans passer par une soumission.</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-500/30 bg-primary-950/20 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total</p>
          <p className="text-2xl font-bold text-white">{money(total)}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Facturé à</label>
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
            <p className="mt-2 text-xs text-slate-500">
              Si Gestion ISR n'est pas dans la liste, ajoute-le d'abord dans <Link href="/crm/contacts" className="text-primary-300 underline">Contacts</Link>.
            </p>
          </div>

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
              <h3 className="text-lg font-semibold text-white">Logements loués</h3>
              <p className="text-xs text-slate-400">Tu peux mettre plusieurs locations sur la même facture.</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-500/40 px-3 py-2 text-xs font-semibold text-primary-200 hover:bg-primary-950/40"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <article key={line.id} className="rounded-xl border border-slate-700 bg-slate-950/55 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">Location {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 1}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-red-950/30 hover:text-red-300 disabled:opacity-30"
                    aria-label={`Supprimer la location ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

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
