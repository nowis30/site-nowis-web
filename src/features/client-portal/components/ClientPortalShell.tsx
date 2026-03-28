'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {session?.impersonation?.active ? (
        <div className="border-b border-amber-500/40 bg-amber-500/15">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-8">
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
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-primary-300">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Portail client sécurisé</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-white">Nowis Client</h1>
          </div>
          {session ? (
            <div className="flex items-center gap-4">
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
        <div className="mx-auto max-w-[88rem] px-4 pb-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Navigation portail client">
          <Link href="/client/dashboard" aria-current={pathname === '/client/dashboard' ? 'page' : undefined} className={`rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${pathname === '/client/dashboard' ? 'border-primary-500/50 bg-primary-500/10 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}>Tableau de bord</Link>
          <Link href="/client/messages" aria-current={pathname === '/client/messages' ? 'page' : undefined} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${pathname === '/client/messages' ? 'border-primary-500/50 bg-primary-500/10 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}>
            Messages
            {unreadMessages > 0 ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-slate-950">{unreadMessages}</span> : null}
          </Link>
          <Link href="/client/song-requests" aria-current={pathname === '/client/song-requests' || pathname.startsWith('/client/song-requests/') ? 'page' : undefined} className={`rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${pathname === '/client/song-requests' || pathname.startsWith('/client/song-requests/') ? 'border-primary-500/50 bg-primary-500/10 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}>Demandes chanson</Link>
          <Link href="/client/documents" aria-current={pathname === '/client/documents' ? 'page' : undefined} className={`rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${pathname === '/client/documents' ? 'border-primary-500/50 bg-primary-500/10 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}>Documents</Link>
          <Link href="/client/appointments" aria-current={pathname === '/client/appointments' ? 'page' : undefined} className={`rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${pathname === '/client/appointments' ? 'border-primary-500/50 bg-primary-500/10 text-primary-100' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}>Rendez-vous</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[88rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}