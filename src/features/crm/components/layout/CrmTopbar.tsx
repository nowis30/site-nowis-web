'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { CrmTokenPayload } from '@/features/crm/auth/session';
import { SearchBar } from '@/features/crm/components/shared/SearchBar';

interface CrmTopbarProps {
  session: CrmTokenPayload;
  onMobileMenuOpen?: () => void;
}

function roleLabel(role: CrmTokenPayload['role']) {
  if (role === 'ADMIN') return 'Administrateur';
  if (role === 'ASSISTANT') return 'Assistant';
  return 'Client portail';
}

export function CrmTopbar({ session, onMobileMenuOpen }: CrmTopbarProps) {
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
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 shrink-0">
          <div className="mb-1 flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={onMobileMenuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-200 hover:border-primary-500/40 hover:text-white"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs uppercase tracking-widest text-slate-500">Navigation</span>
          </div>
          <p className="text-sm text-slate-400">Connecté en tant que</p>
          <p className="text-sm font-semibold text-white sm:text-base">{session.fullName} · {roleLabel(session.role)}</p>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <div ref={searchRef} className="relative min-w-0 flex-1">
            <SearchBar value={query} onChange={handleSearchChange} placeholder="Recherche globale (contacts, dossiers, demandes, ateliers...)" />
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
            className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-2 text-xs font-medium text-slate-300 hover:border-red-500/50 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-60 sm:px-3"
          >
            {loggingOut ? '...' : 'Déconnexion'}
          </button>

          <Link
            href="/crm/dashboard"
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-white"
          >
            Retour dashboard
          </Link>

          <Link
            href="/client/dashboard"
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 rounded-lg border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-xs font-medium text-primary-200 hover:border-primary-400 hover:bg-primary-500/20 hover:text-white sm:inline-flex"
          >
            Portail client (test)
          </Link>
        </div>
      </div>
    </header>
  );
}
