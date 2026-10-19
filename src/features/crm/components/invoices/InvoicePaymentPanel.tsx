'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FINANCE_PAYMENT_METHOD_LABELS, FINANCE_PAYMENT_METHODS } from '@/features/crm/finance/constants';

interface InvoicePaymentPanelProps {
  invoiceId: string;
  status: string;
  total: string;
  paid: string;
  canUpdate: boolean;
  history: { id: string; amount: string; paidAt: string; paymentMethod: string; note: string | null }[];
}

const money = (amount: number | string) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(amount));

export function InvoicePaymentPanel({ invoiceId, status, total, paid, canUpdate, history }: InvoicePaymentPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [partial, setPartial] = useState(false);
  const [open, setOpen] = useState(false);
  const balance = status === 'PAID' ? 0 : Math.max(0, Number(total) - Number(paid));
  const payable = canUpdate && balance > 0 && !['CANCELLED', 'ARCHIVED', 'DELETED'].includes(status);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const paidAt = String(form.get('paidAt') || '');
    setSaving(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(partial ? { amount: Number(form.get('amount')) } : { settleBalance: true }),
          paymentMethod: form.get('paymentMethod'),
          note: String(form.get('note') || '').trim(),
          ...(paidAt ? { paidAt: new Date(`${paidAt}T12:00:00`).toISOString() } : {}),
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Impossible de consigner le paiement.');
      setOpen(false); setSuccess('Paiement enregistré.'); router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible de consigner le paiement.');
    } finally { setSaving(false); }
  }

  return (
    <section id="paiements" className="print:hidden space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Paiements de la facture</h2>
          <p className="mt-1 text-sm text-slate-300">Reçu : {money(status === 'PAID' ? total : paid)} · Solde : {money(balance)}</p>
        </div>
        {payable ? <button type="button" onClick={() => { setOpen(!open); setError(''); }} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
          {open ? 'Fermer' : 'Enregistrer un paiement / Marquer comme payée'}
        </button> : null}
      </div>
      {success ? <p role="status" className="text-sm text-emerald-300">{success}</p> : null}
      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
      {open && payable ? <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-400">Confirme ici un paiement que tu as reçu.</p>
        <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Règlement
            <select value={partial ? 'partial' : 'full'} onChange={(event) => setPartial(event.target.value === 'partial')} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white">
              <option value="full">Solde complet — {money(balance)}</option><option value="partial">Paiement partiel</option>
            </select>
          </label>
          {partial ? <label className="text-sm text-slate-300">Montant reçu ($)
            <input name="amount" type="number" min="0.01" max={balance.toFixed(2)} step="0.01" required className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white" />
          </label> : null}
          <label className="text-sm text-slate-300">Mode de paiement
            <select name="paymentMethod" defaultValue="OTHER" className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white">
              {FINANCE_PAYMENT_METHODS.map((method) => <option key={method} value={method}>{FINANCE_PAYMENT_METHOD_LABELS[method]}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">Date du paiement (aujourd’hui si vide)
            <input type="date" name="paidAt" className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white" />
          </label>
          <label className="text-sm text-slate-300 sm:col-span-2">Note / référence
            <input name="note" maxLength={500} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-white" />
          </label>
        </fieldset>
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Enregistrement…' : partial ? 'Enregistrer le paiement partiel' : 'Confirmer le paiement et marquer comme payée'}</button>
      </form> : null}
      <div>
        <h3 className="text-sm font-semibold text-white">Historique des paiements reçus</h3>
        {history.length ? <ul className="mt-2 divide-y divide-slate-700">
          {history.map((payment) => <li key={payment.id} className="py-2 text-sm text-slate-300">
            {new Date(payment.paidAt).toLocaleDateString('fr-CA', { timeZone: 'UTC' })} · {money(payment.amount)} · {FINANCE_PAYMENT_METHOD_LABELS[payment.paymentMethod as keyof typeof FINANCE_PAYMENT_METHOD_LABELS] || payment.paymentMethod}
            {payment.note ? <p className="mt-1 text-slate-400">{payment.note}</p> : null}
          </li>)}
        </ul> : <p className="mt-2 text-sm text-slate-400">Aucun paiement manuel consigné.{status === 'PAID' ? ' Cette facture est déjà marquée comme payée.' : ''}</p>}
      </div>
    </section>
  );
}
