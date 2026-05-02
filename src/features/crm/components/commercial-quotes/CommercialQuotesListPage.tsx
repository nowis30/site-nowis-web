'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';

type Item = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  validUntil: string | null;
  contact: { id: string; fullName: string } | null;
  organization: { id: string; name: string } | null;
};

const STATUS_FILTERS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED', 'ARCHIVED'] as const;

export function CommercialQuotesListPage({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (!q) return true;
      return (
        item.quoteNumber.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.contact?.fullName || '').toLowerCase().includes(q) ||
        (item.organization?.name || '').toLowerCase().includes(q)
      );
    });
  }, [items, query, status]);

  return (
    <section className="space-y-5 pb-24">
      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Soumissions commerciales</h1>
            <p className="mt-1 text-sm text-slate-400">Module de devis CRM interne (distinct des soumissions entrantes).</p>
          </div>
          <Link href="/crm/commercial-quotes/new" className="inline-flex items-center justify-center rounded-xl border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-200 hover:bg-primary-500/20 hover:text-white">
            + Nouveau devis
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher: numéro, titre, client, organisation"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUS_FILTERS)[number])}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>{value === 'ALL' ? 'Tous statuts' : value}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">Aucun devis trouvé.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/crm/commercial-quotes/${item.id}`} className="text-base font-semibold text-white hover:text-primary-200">
                    {item.quoteNumber} · {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    Client: {item.contact?.fullName || '—'} · Organisation: {item.organization?.name || '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Créée: {new Date(item.createdAt).toLocaleDateString('fr-CA')} · Expire: {item.validUntil ? new Date(item.validUntil).toLocaleDateString('fr-CA') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={item.status} />
                  <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200">
                    {Number(item.totalAmount).toFixed(2)} {item.currency}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/crm/commercial-quotes/${item.id}`} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Voir</Link>
                <Link href={`/crm/commercial-quotes/${item.id}`} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Modifier</Link>
                {item.contact?.id ? <Link href={`/crm/contacts/${item.contact.id}`} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">Client</Link> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
