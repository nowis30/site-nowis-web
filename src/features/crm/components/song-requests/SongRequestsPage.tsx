'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type SongRequestItem = {
  id: string;
  title: string;
  language: string;
  theme: string;
  fullName: string;
  email: string;
  songType: string;
  eventType: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
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
};

interface SongRequestsPageProps {
  items: SongRequestItem[];
}

export function SongRequestsPage({ items }: SongRequestsPageProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | SongRequestItem['status']>('ALL');

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
        </select>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Demande</span>
          <span>Contact</span>
          <span>Date</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">Aucune demande trouvée.</div>
        ) : (
          filteredItems.map((item) => (
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
    </section>
  );
}
