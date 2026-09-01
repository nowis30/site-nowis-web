'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import { ClientMobileBottomNav } from '@/features/client-portal/components/ClientMobileBottomNav';
import { clientPortalNavigation } from '@/features/client-portal/config/navigation';

interface ClientPortalShellProps {
  session: {
    fullName: string;
    email: string;
    impersonation: {
      active: boolean;
      adminId: string;
      adminRole: 'ADMIN';
    } | null;
  } | null;
  children: React.ReactNode;
}

export function ClientPortalShell({ session, children }: ClientPortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!session) return;

    const excludedPaths = [
      '/client/facturation',
      '/client/login',
      '/client/logout',
      '/login',
      '/logout',
    ];

    if (excludedPaths.some((path) => pathname.startsWith(path))) return;

    let cancelled = false;
    async function enforceBilling() {
      try {
        const response = await fetch('/api/client/facturation/status', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as { complete?: boolean } | null;
        if (cancelled) return;
        if (data?.complete) return;

        const query = searchParams?.toString();
        const current = query ? `${pathname}?${query}` : pathname;
        const next = encodeURIComponent(current || '/client');
        router.replace(`/client/facturation?next=${next}`);
      } catch {
        // Silencieux : en cas d’erreur réseau, on ne bloque pas l’interface.
      }
    }

    void enforceBilling();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams, session]);

  async function logout() {
    await fetch('/api/client-auth/logout', { method: 'POST' });
    router.push('/connexion');
    router.refresh();
  }

  async function stopImpersonation() {
    await fetch('/api/client-portal/impersonation/stop', { method: 'POST' });
    router.push('/crm/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-slate-100 antialiased">
      <a
        href="#client-main"
        className="sr-only fixed left-4 top-4 z-[10000] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-xl focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary-400"
      >
        Aller au contenu principal
      </a>

      {session?.impersonation?.active ? (
        <div className="border-b border-amber-500/40 bg-amber-500/15">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-amber-100">
              Mode client actif (admin) — Tu es en train de voir le compte de :{' '}
              <span className="font-semibold text-white">{session.fullName}</span>
            </p>
            <button
              type="button"
              onClick={stopImpersonation}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300/50 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-400/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 motion-reduce:transition-none"
            >
              Quitter le mode client
            </button>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-primary-500/15 bg-slate-950/90 shadow-[0_10px_30px_rgba(2,6,23,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80">
        <div className="mx-auto flex max-w-[88rem] flex-col items-start gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            href="/client/dashboard"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label="Retour au tableau de bord du portail client"
          >
            <div className="flex items-center gap-2 text-primary-300">
              <ShieldCheck size={18} aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Portail client sécurisé</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">NOWIS Client</h1>
          </Link>

          {session ? (
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:gap-4">
              <div className="min-w-0 flex-1 sm:hidden">
                <Link
                  href="/client/dashboard"
                  className="block truncate rounded-md text-sm font-medium text-white transition hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none"
                >
                  {session.fullName}
                </Link>
                <p className="truncate text-xs text-slate-400">{session.email}</p>
                <Link
                  href="/client/profil"
                  className="mt-2 inline-flex min-h-11 items-center rounded-xl border border-primary-500/40 px-3 py-2 text-xs font-semibold text-primary-200 transition hover:border-primary-400/60 hover:bg-primary-500/10 hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none"
                >
                  Profil
                </Link>
              </div>
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-64 truncate text-sm font-medium text-white">{session.fullName}</p>
                <p className="max-w-64 truncate text-xs text-slate-400">{session.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 motion-reduce:transition-none"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">Déconnexion</span>
                <span className="sr-only xs:hidden sm:hidden">Déconnexion</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="mx-auto hidden max-w-[88rem] px-4 pb-4 md:block md:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 pb-1" aria-label="Navigation portail client">
            {clientPortalNavigation.map(({ href, label, matches }) => {
              const isActive = matches(pathname);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'inline-flex min-h-11 items-center whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none',
                    isActive
                      ? 'border-primary-400/50 bg-primary-500/15 text-primary-100 shadow-[0_0_0_1px_rgba(14,165,233,0.08)_inset]'
                      : 'border-slate-700/90 text-slate-300 hover:border-primary-500/40 hover:bg-slate-900/70 hover:text-white',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        id="client-main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[88rem] overflow-x-hidden px-4 py-6 pb-[calc(76px+env(safe-area-inset-bottom))] focus:outline-none sm:px-6 sm:py-8 md:pb-8 lg:px-8"
      >
        {children}
      </main>
      <ClientMobileBottomNav />
    </div>
  );
}
