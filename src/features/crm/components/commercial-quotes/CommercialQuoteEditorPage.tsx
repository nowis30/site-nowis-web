'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectOption = { id: string; label: string };

type LineForm = {
  id?: string;
  title: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxable: boolean;
  sortOrder: number;
};

type FormData = {
  title: string;
  description: string;
  contactId: string;
  organizationId: string;
  workshopRequestId: string;
  songRequestId: string;
  appointmentId: string;
  currency: string;
  validUntil: string;
  notes: string;
  internalNotes: string;
  status: string;
  quoteNumber?: string;
  convertedToInvoiceId?: string | null;
};

type Props = {
  mode: 'create' | 'detail';
  quoteId?: string;
  initialForm: FormData;
  initialLines: LineForm[];
  contactOptions: SelectOption[];
  organizationOptions: SelectOption[];
  workshopOptions: SelectOption[];
  songOptions: SelectOption[];
  appointmentOptions: SelectOption[];
  taxRates: { gst: number; qst: number };
};

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const quoteStatusLabel: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyee',
  ACCEPTED: 'Acceptee',
  DECLINED: 'Refusee',
  ARCHIVED: 'Annulee',
  EXPIRED: 'Expiree',
  CONVERTED: 'Convertie en facture',
};

function getQuoteStatusLabel(status?: string) {
  if (!status) return 'Brouillon';
  return quoteStatusLabel[status] || status;
}

export function CommercialQuoteEditorPage({
  mode,
  quoteId,
  initialForm,
  initialLines,
  contactOptions,
  organizationOptions,
  workshopOptions,
  songOptions,
  appointmentOptions,
  taxRates,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [lines, setLines] = useState<LineForm[]>(
    initialLines.length > 0
      ? initialLines
      : [{ title: 'Service', description: '', quantity: '1', unitPrice: '0', taxable: true, sortOrder: 0 }],
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totals = useMemo(() => {
    const normalized = lines.map((line) => {
      const quantity = toNumber(line.quantity);
      const unitPrice = toNumber(line.unitPrice);
      const subtotal = Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
      return { ...line, quantity, unitPrice, subtotal };
    });
    const subtotal = normalized.reduce((sum, line) => sum + line.subtotal, 0);
    const taxableBase = normalized.filter((line) => line.taxable).reduce((sum, line) => sum + line.subtotal, 0);
    const taxAmount = taxableBase * (taxRates.gst + taxRates.qst);
    const totalAmount = subtotal + taxAmount;
    return {
      subtotal: Math.round((subtotal + Number.EPSILON) * 100) / 100,
      taxAmount: Math.round((taxAmount + Number.EPSILON) * 100) / 100,
      totalAmount: Math.round((totalAmount + Number.EPSILON) * 100) / 100,
    };
  }, [lines, taxRates.gst, taxRates.qst]);

  const payloadLines = lines.map((line, index) => ({
    id: line.id,
    title: line.title,
    description: line.description,
    quantity: toNumber(line.quantity),
    unitPrice: toNumber(line.unitPrice),
    taxable: line.taxable,
    sortOrder: index,
  }));

  const selectedContactLabel = useMemo(
    () => contactOptions.find((option) => option.id === form.contactId)?.label || '—',
    [contactOptions, form.contactId],
  );

  const selectedWorkshopLabel = useMemo(
    () => workshopOptions.find((option) => option.id === form.workshopRequestId)?.label || null,
    [form.workshopRequestId, workshopOptions],
  );

  const selectedSongLabel = useMemo(
    () => songOptions.find((option) => option.id === form.songRequestId)?.label || null,
    [form.songRequestId, songOptions],
  );

  async function save() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const validUntilIso = form.validUntil ? new Date(form.validUntil).toISOString() : '';
      const body = {
        ...form,
        validUntil: validUntilIso,
        lines: payloadLines,
      };
      const endpoint = mode === 'create' ? '/api/crm/commercial-quotes' : `/api/crm/commercial-quotes/${quoteId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; item?: { id: string } } | null;
      if (!response.ok) throw new Error(data?.error || 'Enregistrement impossible');

      if (mode === 'create' && data?.item?.id) {
        router.push(`/crm/commercial-quotes/${data.item.id}`);
        return;
      }

      setMessage('Soumission commerciale mise à jour.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: 'send' | 'send-email' | 'accept' | 'decline' | 'convert-to-invoice') {
    if (!quoteId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/commercial-quotes/${quoteId}/${action}`, { method: 'POST' });
      const data = (await response.json().catch(() => null)) as { error?: string; invoiceId?: string; emailSent?: boolean; message?: string; quoteUrl?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Action impossible');
      if (action === 'convert-to-invoice' && data?.invoiceId) {
        router.push(`/crm/invoices/${data.invoiceId}`);
        return;
      }
      if (action === 'send-email') {
        setMessage(data?.emailSent ? 'Soumission envoyee par courriel.' : (data?.message || 'Lien genere sans envoi email.'));
        return;
      }
      setMessage('Action appliquée.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible');
    } finally {
      setLoading(false);
    }
  }

  async function archive() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/commercial-quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Archivage impossible');
      setMessage('Soumission archivée.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archivage impossible');
    } finally {
      setLoading(false);
    }
  }

  async function cancelQuote() {
    if (!quoteId) return;
    if (!window.confirm('Voulez-vous vraiment annuler cette soumission ? Elle restera dans le CRM, mais ne sera plus active.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/commercial-quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Annulation impossible');
      setForm((current) => ({ ...current, status: 'ARCHIVED' }));
      setMessage('Soumission annulee. Elle est conservee dans le CRM.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annulation impossible');
    } finally {
      setLoading(false);
    }
  }

  async function removeDraft() {
    if (!quoteId) return;
    if (!window.confirm('Supprimer définitivement ce brouillon ?')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/commercial-quotes/${quoteId}`, { method: 'DELETE' });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'Suppression impossible');
      router.push('/crm/commercial-quotes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible');
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 pb-24">
      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <Link href="/crm/commercial-quotes" className="text-sm text-slate-400 hover:text-white">Soumissions commerciales</Link>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {mode === 'create' ? 'Nouveau devis commercial' : `${form.quoteNumber || 'Devis'} · ${form.title}`}
            </h1>
            {mode === 'detail' ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">Statut: {getQuoteStatusLabel(form.status)}</span>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">Client: {selectedContactLabel}</span>
                {selectedSongLabel ? <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">Chanson: {selectedSongLabel}</span> : null}
                {selectedWorkshopLabel ? <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">Atelier: {selectedWorkshopLabel}</span> : null}
                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-100">Total: {totals.totalAmount.toFixed(2)} {form.currency}</span>
              </div>
            ) : null}
          </div>
          {mode === 'detail' && form.convertedToInvoiceId ? (
            <Link href={`/crm/invoices/${form.convertedToInvoiceId}`} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200 hover:text-white">
              Facture creee
            </Link>
          ) : null}
        </div>
      </div>

      {message ? <p className="rounded-xl border border-emerald-700/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-700/50 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">Informations</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Titre</span><input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Description</span><textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs text-slate-400">Client</span><select value={form.contactId} onChange={(e) => setForm((c) => ({ ...c, contactId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="">—</option>{contactOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}</select></label>
              <label><span className="mb-1 block text-xs text-slate-400">Organisation</span><select value={form.organizationId} onChange={(e) => setForm((c) => ({ ...c, organizationId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="">—</option>{organizationOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}</select></label>
              <label><span className="mb-1 block text-xs text-slate-400">Atelier lié</span><select value={form.workshopRequestId} onChange={(e) => setForm((c) => ({ ...c, workshopRequestId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="">—</option>{workshopOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}</select></label>
              <label><span className="mb-1 block text-xs text-slate-400">Chanson liée</span><select value={form.songRequestId} onChange={(e) => setForm((c) => ({ ...c, songRequestId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="">—</option>{songOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}</select></label>
              <label><span className="mb-1 block text-xs text-slate-400">Rendez-vous lié</span><select value={form.appointmentId} onChange={(e) => setForm((c) => ({ ...c, appointmentId: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="">—</option>{appointmentOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}</select></label>
              <label><span className="mb-1 block text-xs text-slate-400">Devise</span><input value={form.currency} onChange={(e) => setForm((c) => ({ ...c, currency: e.target.value.toUpperCase() }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label><span className="mb-1 block text-xs text-slate-400">Valide jusqu'au</span><input type="datetime-local" value={form.validUntil} onChange={(e) => setForm((c) => ({ ...c, validUntil: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Notes client</span><textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} className="min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Notes internes</span><textarea value={form.internalNotes} onChange={(e) => setForm((c) => ({ ...c, internalNotes: e.target.value }))} className="min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
            </div>
            {mode === 'detail' ? (
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => void save()} disabled={loading} className="rounded-lg border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-sm text-primary-200 hover:text-white disabled:opacity-60">
                  {loading ? 'Traitement…' : 'Enregistrer les changements'}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Lignes de soumission</h2>
              <button type="button" onClick={() => setLines((current) => [...current, { title: 'Ligne', description: '', quantity: '1', unitPrice: '0', taxable: true, sortOrder: current.length }])} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200">+ Ligne</button>
            </div>

            <div className="mt-4 space-y-3">
              {lines.map((line, index) => (
                <article key={`${line.id || 'new'}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="grid gap-3 md:grid-cols-12">
                    <label className="md:col-span-5"><span className="mb-1 block text-xs text-slate-400">Titre</span><input value={line.title} onChange={(e) => setLines((current) => current.map((l, i) => (i === index ? { ...l, title: e.target.value } : l)))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
                    <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Qté</span><input type="number" step="0.01" value={line.quantity} onChange={(e) => setLines((current) => current.map((l, i) => (i === index ? { ...l, quantity: e.target.value } : l)))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
                    <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Prix unité</span><input type="number" step="0.01" value={line.unitPrice} onChange={(e) => setLines((current) => current.map((l, i) => (i === index ? { ...l, unitPrice: e.target.value } : l)))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
                    <label className="md:col-span-2 flex items-end gap-2"><input type="checkbox" checked={line.taxable} onChange={(e) => setLines((current) => current.map((l, i) => (i === index ? { ...l, taxable: e.target.checked } : l)))} /><span className="text-xs text-slate-300">Taxable</span></label>
                    <div className="md:col-span-1 flex items-end justify-end"><button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))} className="rounded-md border border-red-700/50 px-2 py-1 text-xs text-red-300">Suppr.</button></div>
                    <label className="md:col-span-12"><span className="mb-1 block text-xs text-slate-400">Description</span><textarea value={line.description} onChange={(e) => setLines((current) => current.map((l, i) => (i === index ? { ...l, description: e.target.value } : l)))} className="min-h-[72px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" /></label>
                    <p className="md:col-span-12 text-right text-xs text-slate-300">
                      Total ligne: {(toNumber(line.quantity) * toNumber(line.unitPrice)).toFixed(2)} {form.currency}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">Totaux</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Sous-total: <span className="font-semibold text-white">{totals.subtotal.toFixed(2)} {form.currency}</span></p>
              <p>Taxes ({(taxRates.gst * 100).toFixed(2)}% + {(taxRates.qst * 100).toFixed(3)}%): <span className="font-semibold text-white">{totals.taxAmount.toFixed(2)} {form.currency}</span></p>
              <p className="pt-2 text-base">Total: <span className="font-semibold text-primary-200">{totals.totalAmount.toFixed(2)} {form.currency}</span></p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">Actions</h2>
            <div className="mt-4 grid gap-2">
              {mode === 'detail' ? (
                <>
                  <button type="button" onClick={() => setIsPreviewOpen(true)} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:text-white">Voir le brouillon</button>
                  <button type="button" onClick={() => void runAction('send-email')} disabled={loading || form.status === 'CONVERTED'} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 disabled:opacity-50">Envoyer par email</button>
                  {form.status !== 'CONVERTED' && !form.convertedToInvoiceId ? (
                    <button type="button" onClick={() => void runAction('convert-to-invoice')} disabled={loading} className="rounded-lg border border-emerald-700/50 px-3 py-2 text-left text-sm text-emerald-200 disabled:opacity-50">Convertir en facture</button>
                  ) : null}
                  <button type="button" onClick={() => void cancelQuote()} disabled={loading || form.status === 'CONVERTED'} className="rounded-lg border border-amber-700/50 px-3 py-2 text-left text-sm text-amber-200 disabled:opacity-50">Annuler la soumission</button>

                  <details className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                    <summary className="cursor-pointer text-sm text-slate-300">Actions avancees</summary>
                    <div className="mt-3 grid gap-2">
                      <button type="button" onClick={() => void runAction('send')} disabled={loading || form.status === 'CONVERTED'} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 disabled:opacity-50">Marquer envoyee (sans email)</button>
                      <button type="button" onClick={() => void runAction('accept')} disabled={loading || form.status === 'CONVERTED'} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 disabled:opacity-50">Marquer acceptee</button>
                      <button type="button" onClick={() => void runAction('decline')} disabled={loading || form.status === 'CONVERTED'} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 disabled:opacity-50">Marquer refusee</button>
                      <button type="button" onClick={() => void archive()} disabled={loading} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 disabled:opacity-50">Archiver</button>
                      <button type="button" onClick={() => void removeDraft()} disabled={loading || form.status !== 'DRAFT'} className="rounded-lg border border-red-700/50 px-3 py-2 text-left text-sm text-red-300 disabled:opacity-50">Supprimer (brouillon seulement)</button>
                    </div>
                  </details>
                </>
              ) : (
                <button type="button" onClick={() => void save()} disabled={loading} className="rounded-lg border border-primary-500/50 bg-primary-500/10 px-3 py-2 text-left text-sm text-primary-200 hover:text-white disabled:opacity-60">{loading ? 'Traitement…' : 'Creer la soumission'}</button>
              )}
              <Link href="/crm/commercial-quotes" className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:text-white">Retour liste</Link>
            </div>
          </section>
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 md:p-8">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Apercu client</p>
                <h3 className="text-lg font-semibold text-white">{form.quoteNumber || 'Soumission'} · {form.title}</h3>
              </div>
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200">Retour</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-6">
                <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <p><span className="text-slate-400">Client:</span> {selectedContactLabel}</p>
                  <p><span className="text-slate-400">Description:</span> {form.description || '—'}</p>
                  <p><span className="text-slate-400">Valide jusqu au:</span> {form.validUntil ? new Date(form.validUntil).toLocaleString('fr-CA') : '—'}</p>
                </section>

                <section className="space-y-3">
                  {lines.map((line, index) => (
                    <article key={`${line.id || 'preview'}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">{line.title || `Ligne ${index + 1}`}</h4>
                        <p className="text-sm text-slate-200">{(toNumber(line.quantity) * toNumber(line.unitPrice)).toFixed(2)} {form.currency}</p>
                      </div>
                      {line.description ? <p className="mt-2 text-sm text-slate-300">{line.description}</p> : null}
                      <p className="mt-2 text-xs text-slate-400">Quantite: {toNumber(line.quantity).toFixed(2)} · Prix: {toNumber(line.unitPrice).toFixed(2)} {form.currency}</p>
                    </article>
                  ))}
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <p>Sous-total: <span className="font-semibold text-white">{totals.subtotal.toFixed(2)} {form.currency}</span></p>
                  <p>Taxes: <span className="font-semibold text-white">{totals.taxAmount.toFixed(2)} {form.currency}</span></p>
                  <p className="pt-1 text-base">Total: <span className="font-semibold text-primary-200">{totals.totalAmount.toFixed(2)} {form.currency}</span></p>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
