'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  unreadMessages: number;
  children: React.ReactNode;
}

export function ClientPortalShell({ session, unreadMessages, children }: ClientPortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();

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
      {session?.impersonation?.active ? (
        <div className="border-b border-amber-500/40 bg-amber-500/15">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-amber-100">Mode client actif (admin) — Tu es en train de voir le compte de : <span className="font-semibold text-white">{session.fullName}</span></p>
            <button
              type="button"
              onClick={stopImpersonation}
              className="rounded-lg border border-amber-300/50 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:border-amber-200 hover:bg-amber-400/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
            >
              Quitter le mode client
            </button>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[88rem] flex-col items-start gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-primary-300">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Portail client sécurisé</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Nowis Client</h1>
          </div>
          {session ? (
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:gap-4">
              <div className="min-w-0 flex-1 md:hidden">
                <Link href="/client/dashboard" className="truncate text-sm font-medium text-white hover:text-primary-200">
                  {session.fullName}
                </Link>
                <p className="truncate text-xs text-slate-400">{session.email}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-white">{session.fullName}</p>
                <p className="text-xs text-slate-400">{session.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
              >
                <LogOut size={15} /> Déconnexion
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
                    'whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
                    isActive ? 'border-primary-500/50 bg-primary-500/10 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white',
                    href === '/client/messages' ? 'inline-flex items-center gap-2' : '',
                  ].join(' ')}
                >
                  <span>{label}</span>
                  {href === '/client/messages' && unreadMessages > 0 ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-slate-950">{unreadMessages}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[88rem] overflow-x-hidden px-4 py-6 pb-[calc(90px+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:pb-8 lg:px-8">{children}</main>
      <ClientMobileBottomNav unreadMessages={unreadMessages} />
    </div>
  );
}