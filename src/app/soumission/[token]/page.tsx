'use client';

import { useEffect, useMemo, useState } from 'react';

type QuoteLine = {
  id: string;
  title: string;
  description: string | null;
  quantity: string;
  unitPrice: string;
  subtotal: string;
};

type QuotePayload = {
  id: string;
  quoteNumber: string;
  title: string;
  description: string | null;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  validUntil: string | null;
  contact: { fullName: string; email: string | null } | null;
  convertedToInvoice: { id: string; number: string; status: string } | null;
  lines: QuoteLine[];
};

function formatMoney(value: string | number, currency = 'CAD') {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(Number(value));
}

export default function PublicQuotePage({ params }: { params: { token: string } }) {
  const [item, setItem] = useState<QuotePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/public/quotes/${params.token}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as { error?: string; item?: QuotePayload } | null;
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

  const canRespond = useMemo(() => item && ['DRAFT', 'SENT'].includes(item.status), [item]);

  async function respond(action: 'accept' | 'decline') {
    setBusy(true);
    setFeedback(null);
    setError(null);
    try {
      const response = await fetch(`/api/public/quotes/${params.token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; status?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || 'Action impossible');
      }
      setFeedback(action === 'accept' ? 'Soumission acceptee. Merci.' : 'Soumission refusee.');
      setItem((current) => (current ? { ...current, status: data?.status || current.status } : current));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-slate-200">Chargement...</main>;
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
        <div className="rounded-2xl border border-red-700/40 bg-red-950/20 p-5 text-sm text-red-200">
          {error || 'Lien invalide ou expire.'}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-semibold text-white">Soumission {item.quoteNumber}</h1>
      <p className="mt-2 text-sm text-slate-400">{item.title}</p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-sm text-slate-300">Statut: <strong>{item.status}</strong></p>
        {item.validUntil ? <p className="mt-1 text-xs text-slate-400">Valide jusqu au {new Date(item.validUntil).toLocaleString('fr-CA')}</p> : null}
        {item.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{item.description}</p> : null}

        <div className="mt-4 space-y-2">
          {item.lines.map((line) => (
            <div key={line.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
              <p className="font-medium text-white">{line.title}</p>
              {line.description ? <p className="text-xs text-slate-400">{line.description}</p> : null}
              <p className="mt-1 text-xs text-slate-400">
                {line.quantity} x {formatMoney(line.unitPrice, item.currency)} = {formatMoney(line.subtotal, item.currency)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
          <p>Sous-total: {formatMoney(item.subtotal, item.currency)}</p>
          <p>Taxes: {formatMoney(item.taxAmount, item.currency)}</p>
          <p className="mt-1 text-lg font-semibold text-white">Total: {formatMoney(item.totalAmount, item.currency)}</p>
        </div>

        {feedback ? <p className="mt-4 rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200">{feedback}</p> : null}
        {error ? <p className="mt-4 rounded-lg border border-red-700/40 bg-red-950/20 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        {canRespond ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void respond('accept')} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60">
              Accepter
            </button>
            <button type="button" onClick={() => void respond('decline')} disabled={busy} className="rounded-lg border border-red-600/50 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-900/30 disabled:opacity-60">
              Refuser
            </button>
          </div>
        ) : null}

        {item.convertedToInvoice ? (
          <p className="mt-4 text-sm text-slate-300">Cette soumission est convertie en facture {item.convertedToInvoice.number}.</p>
        ) : null}
      </div>
    </main>
  );
}
