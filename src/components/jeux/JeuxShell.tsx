'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { NowisRadioPanel } from './NowisRadio';

export function JeuxShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/jeux/oui-la')) {
    return <div className="min-h-dvh bg-[#09090b] text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-200">
      {children}
      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 md:px-6 md:pb-10">
        <div className="mb-4 border-t border-sky-400/30 pt-6 text-xs uppercase tracking-[0.28em] text-yellow-500">
          Radio NOWIS
        </div>
        <NowisRadioPanel compact />
      </footer>
    </div>
  );
}
