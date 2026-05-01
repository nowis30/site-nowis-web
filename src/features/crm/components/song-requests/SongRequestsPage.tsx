'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';

type SongRequestItem = {
  id: string;
  title: string;
  language: string;
  theme: string;
  fullName: string;
  email: string;
  songType: string;
  eventType: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DELETED';
  createdAt: string;
  contact: { id: string; fullName: string; email: string | null };
};

const STATUS_LABELS: Record<SongRequestItem['status'], string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  QUOTED: 'Soumission',
  IN_PROGRESS: 'En cours',
  IN_PRODUCTION: 'En production',
  DELIVERED: 'Livré',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
  DELETED: 'Supprimé',
};

const STATUS_COLORS: Record<SongRequestItem['status'], string> = {
  NEW: 'bg-blue-500/20 text-blue-300',
  CONTACTED: 'bg-indigo-500/20 text-indigo-300',
  QUOTED: 'bg-purple-500/20 text-purple-300',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300',
  IN_PRODUCTION: 'bg-fuchsia-500/20 text-fuchsia-300',
  DELIVERED: 'bg-cyan-500/20 text-cyan-300',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300',
  CANCELLED: 'bg-slate-500/20 text-slate-300',
  DELETED: 'bg-red-900/40 text-red-200',
};

interface SongRequestsPageProps {
  items: SongRequestItem[];
}

function getSongRequestEmptyText(status: 'ALL' | SongRequestItem['status']) {
  if (status === 'DELIVERED') return 'Aucune demande livrée';
  if (status === 'DELETED') return 'Aucune demande supprimée';
  if (status === 'COMPLETED') return 'Aucune demande terminée';
  return 'Aucune demande trouvée';
}

export function SongRequestsPage({ items }: SongRequestsPageProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | SongRequestItem['status']>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const filteredItems = useMemo(() => {
    const cleanedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const statusOk = status === 'ALL' || item.status === status;
      if (!statusOk) return false;
      if (!cleanedQuery) return true;

      return (
        item.fullName.toLowerCase().includes(cleanedQuery) ||
        item.email.toLowerCase().includes(cleanedQuery) ||
        item.eventType.toLowerCase().includes(cleanedQuery) ||
        item.title.toLowerCase().includes(cleanedQuery)
      );
    });
  }, [items, query, status]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, status]);

  const emptyText = getSongRequestEmptyText(status);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Demandes de chanson</h2>
        <p className="mt-1 text-sm text-slate-400">
          Toutes les demandes reçues depuis le formulaire public, liées aux contacts CRM.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher nom, email, occasion..."
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 md:col-span-2"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'ALL' | SongRequestItem['status'])}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="NEW">Nouveau</option>
          <option value="CONTACTED">Contacté</option>
          <option value="QUOTED">Soumission</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="IN_PRODUCTION">En production</option>
          <option value="DELIVERED">Livré</option>
          <option value="COMPLETED">Complété</option>
          <option value="CANCELLED">Annulé</option>
          <option value="DELETED">Supprimé</option>
        </select>
      </div>

      <p className="text-xs text-slate-400">Affichage {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} sur {filteredItems.length}</p>

      <div className="grid gap-3 md:hidden">
        {paginatedItems.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">{emptyText}</p>
        ) : (
          paginatedItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('fr-CA')}</p>
                  <p className="text-xs text-slate-300">{item.fullName}</p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                  <p className="text-xs text-slate-500">{item.songType} · {item.eventType}</p>
                </div>
                <StatusBadge value={item.status} />
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200">Actions</summary>
                <div className="mt-2 flex flex-col gap-1">
                  <Link href={`/crm/song-requests/${item.id}`} className="rounded-md border border-primary-500/50 px-2 py-1 text-xs text-primary-300 hover:bg-primary-900/30">Voir</Link>
                  <Link href={`/crm/song-requests/${item.id}`} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Modifier</Link>
                  <Link href={`/crm/contacts/${item.contact.id}`} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Voir contact</Link>
                </div>
              </details>
            </article>
          ))
        )}
      </div>

      <div className="hidden rounded-2xl border border-slate-800 bg-slate-900/70 md:block">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Demande</span>
          <span>Contact</span>
          <span>Date</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {paginatedItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">{emptyText}</div>
        ) : (
          paginatedItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] items-center gap-3 border-b border-slate-800/70 px-4 py-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.fullName}</p>
                <p className="text-xs text-slate-400">{item.email}</p>
                <p className="text-xs text-slate-500">{item.songType} · {item.eventType} · {item.language}</p>
                <p className="text-xs text-slate-600">Thème: {item.theme}</p>
              </div>

              <div>
                <Link href={`/crm/contacts/${item.contact.id}`} className="text-primary-300 hover:text-primary-200">
                  {item.contact.fullName}
                </Link>
                <p className="text-xs text-slate-500">{item.contact.email ?? '—'}</p>
              </div>

              <span className="text-slate-300">
                {new Date(item.createdAt).toLocaleDateString('fr-CA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>

              <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs ${STATUS_COLORS[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>

              <Link
                href={`/crm/song-requests/${item.id}`}
                className="inline-flex w-fit items-center rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-primary-500/50 hover:text-primary-300"
              >
                Ouvrir
              </Link>
            </div>
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
