'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CleanupSection = 'song' | 'workshop' | 'submission' | 'invoice';

interface SongItem {
  id: string;
  fullName: string;
  email: string;
  status: string;
  isTest: boolean;
  testReason: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface WorkshopItem {
  id: string;
  title: string;
  workshopTheme: string;
  status: string;
  isTest: boolean;
  testReason: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface SubmissionItem {
  id: string;
  subject: string;
  submissionStatus: string;
  isTest: boolean;
  testReason: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface InvoiceItem {
  id: string;
  number: string;
  status: string;
  paypalStatus: string | null;
  paypalInvoiceId: string | null;
  isTest: boolean;
  testReason: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  contact: { fullName: string } | null;
}

interface CleanupData {
  songRequests: SongItem[];
  workshopRequests: WorkshopItem[];
  submissions: SubmissionItem[];
  invoices: InvoiceItem[];
}

// ─── Confirmation modale ──────────────────────────────────────────────────────

function ConfirmDeleteModal({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-900/60 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold text-red-400">Suppression définitive</h3>
        <p className="mb-4 text-sm text-slate-300">
          Cette action est <strong>définitive</strong>. Elle ne doit être utilisée que pour des données de test.
          Les vraies factures payées ne peuvent pas être supprimées.
        </p>
        <p className="mb-2 text-xs text-slate-400">
          Élément : <span className="font-medium text-slate-200">{label}</span>
        </p>
        <p className="mb-3 text-xs text-slate-400">
          Tapez <span className="font-mono text-red-300">SUPPRIMER</span> pour confirmer :
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-red-500 focus:outline-none"
          placeholder="SUPPRIMER"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={input !== 'SUPPRIMER'}
            onClick={onConfirm}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-600"
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Badge statut ─────────────────────────────────────────────────────────────

function StatusBadge({ item }: { item: { isTest: boolean; archivedAt: string | null; deletedAt: string | null } }) {
  if (item.deletedAt) return <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs text-red-300">Supprimé</span>;
  if (item.archivedAt) return <span className="rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-300">Archivé</span>;
  if (item.isTest) return <span className="rounded-full bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300">Test</span>;
  return null;
}

// ─── Ligne d'action ───────────────────────────────────────────────────────────

function ActionButtons({
  onRestore,
  onDeletePermanent,
  loading,
}: {
  onRestore: () => void;
  onDeletePermanent: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={onRestore}
        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
      >
        Restaurer
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onDeletePermanent}
        className="rounded-lg border border-red-800/60 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 disabled:opacity-40"
      >
        Suppr. définitif
      </button>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CrmCleanupPage() {
  const [data, setData] = useState<CleanupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ url: string; label: string; method: string } | null>(null);
  const [activeSection, setActiveSection] = useState<CleanupSection>('song');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crm/cleanup');
      if (!res.ok) throw new Error('Erreur lors du chargement.');
      const json = await res.json() as CleanupData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function doAction(url: string, method: string, key: string) {
    setActionLoading(key);
    setActionError(null);
    try {
      const res = await fetch(url, { method });
      const json = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? 'Action échouée.');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setActionLoading(null);
    }
  }

  function requestDelete(url: string, method: string, label: string) {
    setConfirmDelete({ url, method, label });
  }

  const tabs: { key: CleanupSection; label: string; count: number }[] = data
    ? [
        { key: 'song', label: 'Chansons', count: data.songRequests.length },
        { key: 'workshop', label: 'Ateliers', count: data.workshopRequests.length },
        { key: 'submission', label: 'Soumissions', count: data.submissions.length },
        { key: 'invoice', label: 'Factures', count: data.invoices.length },
      ]
    : [];

  const totalHidden = data
    ? data.songRequests.length + data.workshopRequests.length + data.submissions.length + data.invoices.length
    : 0;

  return (
    <section className="space-y-6">
      {confirmDelete && (
        <ConfirmDeleteModal
          label={confirmDelete.label}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const d = confirmDelete;
            setConfirmDelete(null);
            await doAction(d.url, d.method, d.url);
          }}
        />
      )}

      <div>
        <h2 className="text-2xl font-semibold text-white">Nettoyage CRM</h2>
        <p className="text-sm text-slate-400">
          Données masquées des listes normales (test, archivées, supprimées).
          {totalHidden > 0 && (
            <span className="ml-2 rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-300">
              {totalHidden} éléments masqués au total
            </span>
          )}
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
      {actionError && <p className="rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-300">{actionError}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : data ? (
        <>
          {/* Onglets */}
          <div className="flex gap-2 border-b border-slate-800 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSection(tab.key)}
                className={[
                  'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                  activeSection === tab.key
                    ? 'border-b-2 border-primary-500 text-white'
                    : 'text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-xs">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Section Chansons */}
          {activeSection === 'song' && (
            <CleanupList
              items={data.songRequests}
              renderLabel={(item) => `${item.fullName} — ${item.email}`}
              renderMeta={(item) => item.status}
              restoreUrl={(item) => `/api/crm/song-requests/${item.id}/restore`}
              deleteUrl={(item) => `/api/crm/song-requests/${item.id}/delete-permanent`}
              actionLoading={actionLoading}
              doAction={doAction}
              requestDelete={requestDelete}
            />
          )}

          {/* Section Ateliers */}
          {activeSection === 'workshop' && (
            <CleanupList
              items={data.workshopRequests}
              renderLabel={(item) => item.title || item.workshopTheme}
              renderMeta={(item) => item.status}
              restoreUrl={(item) => `/api/crm/workshop-requests/${item.id}/restore`}
              deleteUrl={(item) => `/api/crm/workshop-requests/${item.id}/delete-permanent`}
              actionLoading={actionLoading}
              doAction={doAction}
              requestDelete={requestDelete}
            />
          )}

          {/* Section Soumissions */}
          {activeSection === 'submission' && (
            <CleanupList
              items={data.submissions}
              renderLabel={(item) => item.subject}
              renderMeta={(item) => item.submissionStatus}
              restoreUrl={(item) => `/api/crm/submissions/${item.id}/restore`}
              deleteUrl={(item) => `/api/crm/submissions/${item.id}/delete-permanent`}
              actionLoading={actionLoading}
              doAction={doAction}
              requestDelete={requestDelete}
            />
          )}

          {/* Section Factures */}
          {activeSection === 'invoice' && (
            <CleanupList
              items={data.invoices}
              renderLabel={(item) => `${item.number} — ${item.contact?.fullName ?? '—'}`}
              renderMeta={(item) => `${item.status}${item.paypalStatus ? ` | PayPal: ${item.paypalStatus}` : ''}${item.paypalInvoiceId ? ' [Live?]' : ''}`}
              restoreUrl={(item) => `/api/crm/invoices/${item.id}/restore`}
              deleteUrl={(item) => `/api/crm/invoices/${item.id}/delete-permanent`}
              actionLoading={actionLoading}
              doAction={doAction}
              requestDelete={requestDelete}
            />
          )}
        </>
      ) : null}
    </section>
  );
}

// ─── Liste générique ──────────────────────────────────────────────────────────

function CleanupList<T extends { id: string; isTest: boolean; archivedAt: string | null; deletedAt: string | null; createdAt: string }>({
  items,
  renderLabel,
  renderMeta,
  restoreUrl,
  deleteUrl,
  actionLoading,
  doAction,
  requestDelete,
}: {
  items: T[];
  renderLabel: (item: T) => string;
  renderMeta: (item: T) => string;
  restoreUrl: (item: T) => string;
  deleteUrl: (item: T) => string;
  actionLoading: string | null;
  doAction: (url: string, method: string, key: string) => Promise<void>;
  requestDelete: (url: string, method: string, label: string) => void;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">Aucun élément dans cette catégorie.</p>;
  }

  return (
    <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
      {items.map((item) => {
        const label = renderLabel(item);
        const key = item.id;
        const isLoading = actionLoading === key || actionLoading === deleteUrl(item);
        return (
          <div key={item.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-200">{label}</span>
                <StatusBadge item={item} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {renderMeta(item)} &middot; {new Date(item.createdAt).toLocaleDateString('fr-CA')}
              </p>
            </div>
            <ActionButtons
              loading={isLoading}
              onRestore={() => void doAction(restoreUrl(item), 'POST', key)}
              onDeletePermanent={() => requestDelete(deleteUrl(item), 'DELETE', label)}
            />
          </div>
        );
      })}
    </div>
  );
}
