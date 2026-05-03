'use client';

import { useEffect, useState } from 'react';

type InvoicePayload = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  status: string;
  description: string | null;
  paypalInvoiceUrl: string | null;
  paypalStatus: string | null;
  paymentStatus: string | null;
  paymentProvider: string | null;
  paymentAmount: string | null;
  paymentCurrency: string | null;
  paypalPaidAt: string | null;
  contact: { fullName: string; email: string | null };
};

function formatMoney(value: string | number | null, currency = 'CAD') {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(Number(value));
}

export default function PublicInvoicePage({ params }: { params: { token: string } }) {
  const [item, setItem] = useState<InvoicePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/public/invoices/${params.token}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as { error?: string; item?: InvoicePayload } | null;
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

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-200">Chargement...</main>;
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
        <div className="rounded-2xl border border-red-700/40 bg-red-950/20 p-5 text-sm text-red-200">{error || 'Lien invalide ou expire.'}</div>
      </main>
    );
  }

  const paid = (item.paymentStatus || '').toLowerCase() === 'paid' || item.status === 'PAID';

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">Facture {item.number}</h1>
      <p className="mt-2 text-sm text-slate-400">Client: {item.contact.fullName}</p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-sm text-slate-300">Statut CRM: <strong>{item.status}</strong></p>
        <p className="text-sm text-slate-300">Statut paiement: <strong>{item.paymentStatus || 'unpaid'}</strong></p>
        <p className="mt-2 text-sm text-slate-400">Emise le {new Date(item.issueDate).toLocaleDateString('fr-CA')} · Echeance {new Date(item.dueDate).toLocaleDateString('fr-CA')}</p>

        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Montant</p>
          <p className="mt-1 text-2xl font-semibold text-white">{formatMoney(item.paymentAmount || item.amount, item.paymentCurrency || 'CAD')}</p>
        </div>

        {item.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{item.description}</p> : null}

        {paid ? (
          <p className="mt-4 rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200">
            Facture payee{item.paypalPaidAt ? ` le ${new Date(item.paypalPaidAt).toLocaleString('fr-CA')}` : ''}.
          </p>
        ) : item.paypalInvoiceUrl ? (
          <a
            href={item.paypalInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-lg border border-emerald-600/50 bg-emerald-950/20 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/30"
          >
            Payer avec PayPal
          </a>
        ) : (
          <p className="mt-4 rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
            Paiement PayPal non configure pour cette facture.
          </p>
        )}
      </div>
    </main>
  );
}
