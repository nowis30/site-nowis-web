'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

export type ContactListItem = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  organizationName: string | null;
  crmStatus: string;
  createdAt: string;
};

function getSortKey(item: ContactListItem): string {
  const name = item.fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length > 1) {
      // Dernier mot = approximation du nom de famille
      return parts[parts.length - 1];
    }
    // Nom simple: utiliser le prénom/nom unique
    return parts[0];
  }
  if (item.email?.trim()) return item.email.trim();
  return '';
}

function getGroupLetter(sortKey: string): string {
  if (!sortKey) return '#';
  // Normaliser les accents: É → E, à → A, etc.
  const normalized = sortKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const first = normalized.charAt(0);
  return /[A-Z]/.test(first) ? first : '#';
}

function buildOutlookHref(email: string) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
}

export function CrmContactsAlphaList({ items }: { items: ContactListItem[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.fullName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
        item.organizationName?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const ka = getSortKey(a).toLowerCase();
      const kb = getSortKey(b).toLowerCase();
      if (!ka && !kb) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (!ka) return 1;
      if (!kb) return -1;
      const byKey = ka.localeCompare(kb, 'fr', { sensitivity: 'base' });
      if (byKey !== 0) return byKey;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const groups: Record<string, ContactListItem[]> = {};
    for (const item of sorted) {
      const letter = getGroupLetter(getSortKey(item));
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(item);
    }

    const letters = Object.keys(groups).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return letters.map((letter) => ({ letter, items: groups[letter] }));
  }, [filtered]);

  return (
    <section className="space-y-6">
      {/* En-tête */}
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Contacts</h1>
            <p className="mt-1 text-sm text-slate-400">
              {items.length} contact{items.length !== 1 ? 's' : ''} au total
              {search.trim() ? ` — ${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, courriel, téléphone, organisation…"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-primary-500/60 focus:outline-none"
          />
        </div>
      </div>

      {/* Lettre de saut rapide — desktop */}
      {grouped.length > 0 && (
        <div className="hidden flex-wrap gap-1 sm:flex">
          {grouped.map(({ letter }) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="rounded-md border border-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 hover:border-primary-500/40 hover:text-white"
            >
              {letter}
            </a>
          ))}
        </div>
      )}

      {/* Liste alphabétique */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
          Aucun contact trouvé.
        </div>
      ) : (
        <div className="space-y-4 pb-24">
          {grouped.map(({ letter, items: groupItems }) => (
            <div
              key={letter}
              id={`letter-${letter}`}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 px-5 py-3">
                <span className="text-lg font-bold text-primary-300">{letter}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {groupItems.length}
                </span>
              </div>

              <ul className="divide-y divide-slate-800/50">
                {groupItems.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-800/40"
                  >
                    {/* Infos principales (lien cliquable) */}
                    <Link href={`/crm/contacts/${item.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white group-hover:text-primary-200">
                        {item.fullName ?? item.email ?? (
                          <span className="italic text-slate-500">Contact sans nom</span>
                        )}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {item.organizationName && (
                          <span className="font-medium text-slate-300">{item.organizationName}</span>
                        )}
                        {item.email && <span>{item.email}</span>}
                        {item.phone && <span>{item.phone}</span>}
                      </div>
                    </Link>

                    {/* Actions rapides — desktop */}
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                      <Link
                        href={`/crm/contacts/${item.id}`}
                        className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500/40 hover:text-white"
                      >
                        Voir
                      </Link>
                      {item.email ? (
                        <a
                          href={buildOutlookHref(item.email)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500/40 hover:text-white"
                        >
                          Courriel
                        </a>
                      ) : null}
                      {item.phone ? (
                        <a
                          href={`tel:${item.phone.replace(/\s+/g, '')}`}
                          className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500/40 hover:text-white"
                        >
                          Appeler
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
