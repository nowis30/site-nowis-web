'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { CrmSidebar } from '@/features/crm/components/layout/CrmSidebar';
import { CrmTopbar } from '@/features/crm/components/layout/CrmTopbar';
import { CrmTokenPayload } from '@/features/crm/auth/session';

const CRM_SIDEBAR_STORAGE_KEY = 'nowis_crm_sidebar_open';

interface CrmShellProps {
  session: CrmTokenPayload;
  children: React.ReactNode;
}

export function CrmShell({ session, children }: CrmShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CRM_SIDEBAR_STORAGE_KEY);
    if (stored === '0') {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CRM_SIDEBAR_STORAGE_KEY, sidebarOpen ? '1' : '0');
  }, [sidebarOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex min-h-[100dvh] overflow-hidden">
        <div className="hidden md:block">
          <CrmSidebar role={session.role} isOpen={sidebarOpen} onToggle={() => setSidebarOpen((prev) => !prev)} />
        </div>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-[60] flex md:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              className="flex-1 bg-slate-950/70"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex h-[100dvh] w-[86vw] max-w-[22rem] flex-col overflow-hidden border-l border-slate-800 bg-slate-950 shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white"
                aria-label="Fermer la navigation"
              >
                <X size={16} />
              </button>
              <CrmSidebar role={session.role} isOpen={true} mobile onNavigate={() => setMobileMenuOpen(false)} className="h-full overflow-y-auto border-r-0 border-l-0 pt-12" />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CrmTopbar session={session} onMobileMenuOpen={() => setMobileMenuOpen(true)} />
          <main className="crm-main-scroll min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">
            <div className="min-w-0 w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
