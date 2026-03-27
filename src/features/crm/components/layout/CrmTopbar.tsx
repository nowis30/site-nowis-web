'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrmTokenPayload } from '@/features/crm/auth/session';
import { SearchBar } from '@/features/crm/components/shared/SearchBar';

interface CrmTopbarProps {
  session: CrmTokenPayload;
}

export function CrmTopbar({ session }: CrmTopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ label: string; href: string }>>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce : attendre 350 ms après la dernière frappe avant de lancer la recherche
  useEffect(() => {
    const cleaned = query.trim();
    if (cleaned.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/crm/search?q=${encodeURIComponent(cleaned)}`, { cache: 'no-store' });
        const data = await response.json();
        if (response.ok) {
          setResults(data.items ?? []);
          setShowResults(true);
        }
      } catch {
        // Ignorer les erreurs réseau silencieuses
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Fermer les résultats au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/crm/auth/logout', { method: 'POST' });
    } finally {
      router.push('/crm/login');
      router.refresh();
    }
  }

  function handleSearchChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) setShowResults(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 shrink-0">
          <p className="text-sm text-slate-400">Connecté en tant que</p>
          <p className="text-base font-semibold text-white">{session.fullName} · {session.role}</p>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div ref={searchRef} className="relative min-w-0 flex-1">
            <SearchBar value={query} onChange={handleSearchChange} placeholder="Recherche globale (contacts, dossiers, immeubles...)" />
            {showResults && results.length > 0 ? (
              <div className="absolute right-0 z-20 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-soft">
                {results.map((item) => (
                  <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setShowResults(false)} className="block border-b border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 last:border-b-0">
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-red-500/50 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-60"
          >
            {loggingOut ? '...' : 'Déconnexion'}
          </button>

          <Link
            href="/client/dashboard"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-xs font-medium text-primary-200 hover:border-primary-400 hover:bg-primary-500/20 hover:text-white"
          >
            Portail client (test)
          </Link>
        </div>
      </div>
    </header>
  );
}
