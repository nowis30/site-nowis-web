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

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString('fr-CA', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function statusTone(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return 'border-emerald-600/40 bg-emerald-950/30 text-emerald-200';
    case 'DECLINED':
      return 'border-red-600/40 bg-red-950/30 text-red-200';
    case 'SENT':
      return 'border-sky-600/40 bg-sky-950/30 text-sky-200';
    default:
      return 'border-amber-600/40 bg-amber-950/30 text-amber-200';
  }
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
      setFeedback(
        action === 'accept'
          ? 'Soumission acceptee. Merci ! Vous recevrez votre facture par email sous peu.'
          : 'Soumission refusee. Contactez-nous si vous avez des questions.',
      );
      setItem((current) => (current ? { ...current, status: data?.status || current.status } : current));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
            <p className="text-sm text-slate-300">Chargement de la soumission...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-red-700/40 bg-red-950/20 p-6 text-sm text-red-200 sm:p-8">
            {error || 'Lien invalide ou expire.'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-slate-900/60">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Soumission commerciale</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{item.quoteNumber}</h1>
          <p className="mt-2 max-w-3xl text-base text-slate-300">{item.title}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <span className={`inline-flex rounded-full border px-3 py-1 font-medium ${statusTone(item.status)}`}>
              Statut: {item.status}
            </span>
            {formatDate(item.validUntil) ? (
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">
                Valide jusqu'au {formatDate(item.validUntil)}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">
              Devise: {item.currency}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/30 sm:p-6">
          {item.description ? (
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm leading-relaxed text-slate-300">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</p>
              <p className="whitespace-pre-wrap">{item.description}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-800 bg-slate-950/30">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500 sm:grid">
              <span>Article</span>
              <span className="text-right">Quantite</span>
              <span className="text-right">Prix</span>
              <span className="text-right">Sous-total</span>
            </div>
            <div className="divide-y divide-slate-800">
              {item.lines.map((line) => (
                <div key={line.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <div>
                    <p className="font-medium text-white">{line.title}</p>
                    {line.description ? <p className="mt-1 text-xs text-slate-400">{line.description}</p> : null}
                  </div>
                  <p className="text-sm text-slate-300 sm:text-right">{line.quantity}</p>
                  <p className="text-sm text-slate-300 sm:text-right">{formatMoney(line.unitPrice, item.currency)}</p>
                  <p className="text-sm font-medium text-white sm:text-right">{formatMoney(line.subtotal, item.currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resume</p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span>Sous-total</span>
                <span>{formatMoney(item.subtotal, item.currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Taxes</span>
                <span>{formatMoney(item.taxAmount, item.currency)}</span>
              </div>
              <div className="mt-3 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between gap-3 text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{formatMoney(item.totalAmount, item.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {feedback ? <p className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">{feedback}</p> : null}
          {error ? <p className="rounded-2xl border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          {canRespond ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
              <p className="mb-3 text-sm text-slate-300">Vous pouvez accepter ou refuser cette soumission.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void respond('accept')}
                  disabled={busy}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {busy ? 'Traitement...' : 'Accepter'}
                </button>
                <button
                  type="button"
                  onClick={() => void respond('decline')}
                  disabled={busy}
                  className="rounded-xl border border-red-600/50 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-900/30 disabled:opacity-60"
                >
                  Refuser
                </button>
              </div>
            </div>
          ) : null}

          {item.convertedToInvoice ? (
            <p className="rounded-2xl border border-sky-700/40 bg-sky-950/20 px-4 py-3 text-sm text-sky-200">
              Cette soumission est convertie en facture {item.convertedToInvoice.number}.
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
