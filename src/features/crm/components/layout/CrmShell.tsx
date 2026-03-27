'use client';

import { useEffect, useState } from 'react';
import { CrmSidebar } from '@/features/crm/components/layout/CrmSidebar';
import { CrmTopbar } from '@/features/crm/components/layout/CrmTopbar';
import { CrmTokenPayload } from '@/features/crm/auth/session';

const CRM_SIDEBAR_STORAGE_KEY = 'nowis_crm_sidebar_open';

interface CrmShellProps {
  session: CrmTokenPayload;
  children: React.ReactNode;
}

export function CrmShell({ session, children }: CrmShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(CRM_SIDEBAR_STORAGE_KEY);
    if (stored === '0') {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CRM_SIDEBAR_STORAGE_KEY, sidebarOpen ? '1' : '0');
  }, [sidebarOpen]);

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full overflow-hidden">
        <CrmSidebar role={session.role} isOpen={sidebarOpen} onToggle={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CrmTopbar session={session} />
          <main className="crm-main-scroll min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
            <div className="min-w-0 w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
