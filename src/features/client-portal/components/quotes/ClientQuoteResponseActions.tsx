'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ClientQuoteResponseActionsProps = {
  quoteId: string;
  initialStatus: string;
};

const RESPONDABLE_STATUSES = new Set(['DRAFT', 'SENT']);

export function ClientQuoteResponseActions({ quoteId, initialStatus }: ClientQuoteResponseActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRespond = RESPONDABLE_STATUSES.has(status);

  async function respond(action: 'accept' | 'decline') {
    if (!canRespond || busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/commercial-quotes/${quoteId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string; status?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || 'Action impossible');
      }

      if (data?.status) {
        setStatus(data.status);
      }
      router.refresh();
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!canRespond || busy}
          onClick={() => void respond('accept')}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Traitement...' : 'Accepter la soumission'}
        </button>
        <button
          type="button"
          disabled={!canRespond || busy}
          onClick={() => void respond('decline')}
          className="inline-flex items-center justify-center rounded-xl border border-rose-500/50 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Traitement...' : 'Refuser la soumission'}
        </button>
      </div>

      {!canRespond ? (
        <p className="text-xs text-slate-400">Cette soumission n'est plus modifiable depuis votre portail.</p>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
