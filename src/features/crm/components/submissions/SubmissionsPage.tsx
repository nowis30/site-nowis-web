'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/features/crm/components/shared/SearchBar';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';

type Submission = {
  id: string;
  subject: string;
  message: string;
  source: string | null;
  submissionStatus: 'NOUVEAU' | 'LU' | 'TRAITE' | 'ARCHIVE' | 'SUPPRIME';
  receivedAt: string;
  contact: { id: string; fullName: string; email: string | null; phone: string | null } | null;
};

const STATUS_OPTIONS: Array<{ value: 'ACTIFS' | Submission['submissionStatus']; label: string }> = [
  { value: 'ACTIFS', label: 'Actives' },
  { value: 'NOUVEAU', label: 'Nouvelles' },
  { value: 'LU', label: 'Lues' },
  { value: 'TRAITE', label: 'Traitées' },
  { value: 'ARCHIVE', label: 'Archivées' },
  { value: 'SUPPRIME', label: 'Supprimées' },
];

async function patchSubmission(id: string, action: string) {
  const response = await fetch(`/api/crm/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Action impossible');
  }
}

export function SubmissionsPage({ items }: { items: Submission[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIFS' | Submission['submissionStatus']>('ACTIFS');
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== 'ACTIFS' && item.submissionStatus !== status) return false;
      if (status === 'ACTIFS' && item.submissionStatus === 'SUPPRIME') return false;
      if (!q) return true;
      return (
        item.subject.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.contact?.fullName || '').toLowerCase().includes(q) ||
        (item.contact?.email || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const emptyText = status === 'SUPPRIME' ? 'Aucune soumission supprimée' : 'Aucune soumission trouvée';

  async function applyAction(id: string, action: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setLoadingId(id);
    setError(null);
    try {
      await patchSubmission(id, action);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible');
    } finally {
      setLoadingId(null);
    }
  }

  function resetPageOnFilter() {
    setCurrentPage(1);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Soumissions</h2>
          <p className="text-sm text-slate-400">Formulaires entrants, triage et suivi administratif.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'ACTIFS' | Submission['submissionStatus']);
              resetPageOnFilter();
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SearchBar value={search} onChange={(value) => { setSearch(value); resetPageOnFilter(); }} placeholder="Recherche soumissions" />
        </div>
      </div>

      {error ? <p className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {loadingId ? <p className="text-sm text-slate-400">Chargement…</p> : null}

      <p className="text-xs text-slate-400">Affichage {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} sur {filtered.length}</p>

      <div className="grid gap-3">
        {paginated.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">{emptyText}</p>
        ) : (
          paginated.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{item.subject}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(item.receivedAt).toLocaleString('fr-CA')} · {item.source || 'source inconnue'}
                  </p>
                  <div className="text-xs text-slate-300">
                    {item.contact ? `${item.contact.fullName}${item.contact.email ? ` · ${item.contact.email}` : ''}` : 'Contact non lié'}
                  </div>
                </div>
                <StatusBadge value={item.submissionStatus} />
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-slate-200">{item.message}</p>

              <details className="mt-4">
                <summary className="cursor-pointer rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200">Actions</summary>
                <div className="mt-2 flex flex-col gap-1">
                  {item.contact ? (
                    <a href={`/crm/contacts/${item.contact.id}`} className="rounded-md border border-primary-500/50 px-2 py-1 text-xs text-primary-300 hover:bg-primary-900/30">
                      Voir
                    </a>
                  ) : null}

                  {item.submissionStatus !== 'LU' ? (
                    <button type="button" onClick={() => void applyAction(item.id, 'mark_read')} disabled={loadingId === item.id} className="rounded-md border border-slate-600 px-2 py-1 text-left text-xs text-slate-200">
                      Modifier (marquer lu)
                    </button>
                  ) : null}

                  {item.submissionStatus !== 'TRAITE' ? (
                    <button type="button" onClick={() => void applyAction(item.id, 'process')} disabled={loadingId === item.id} className="rounded-md border border-indigo-500/50 px-2 py-1 text-left text-xs text-indigo-300">
                      Modifier (en cours)
                    </button>
                  ) : null}

                  {item.submissionStatus !== 'ARCHIVE' ? (
                    <button type="button" onClick={() => void applyAction(item.id, 'archive')} disabled={loadingId === item.id} className="rounded-md border border-amber-500/50 px-2 py-1 text-left text-xs text-amber-300">
                      Archiver
                    </button>
                  ) : null}

                  {item.submissionStatus !== 'SUPPRIME' ? (
                    <button
                      type="button"
                      onClick={() => void applyAction(item.id, 'delete', 'Supprimer cette soumission ?')}
                      disabled={loadingId === item.id}
                      className="rounded-md border border-red-500/50 px-2 py-1 text-left text-xs text-red-300"
                    >
                      Supprimer
                    </button>
                  ) : (
                    <button type="button" onClick={() => void applyAction(item.id, 'restore')} disabled={loadingId === item.id} className="rounded-md border border-emerald-500/50 px-2 py-1 text-left text-xs text-emerald-300">
                      Restaurer
                    </button>
                  )}
                </div>
              </details>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Page {currentPage}/{totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </section>
  );
}
