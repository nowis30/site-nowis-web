/** Shared public shell. Private portals and standalone games keep their layouts. */
'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { SiteAssistant } from '@/components/assistant/SiteAssistant';

interface AppLayoutProps { children: ReactNode; }

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith('/crm') || pathname.startsWith('/client');
  const isGamesHub = pathname === '/jeux';
  const isStandaloneMiniGame = pathname.startsWith('/jeux/') && pathname !== '/jeux/heritier-millionnaire';
  if (isAppRoute || isGamesHub || isStandaloneMiniGame) return <>{children}</>;

  return (
    <div className="public-site site-background relative flex min-h-screen flex-col overflow-x-clip pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] text-[color:var(--site-text)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-white focus:p-4 focus:text-black">Aller au contenu</a>
      <div><Header /></div>
      <main id="main-content" tabIndex={-1} className="nm-public-main relative z-0 flex-grow">{children}</main>
      <div className="relative z-0"><Footer /></div>
      <div className="nowis-site-assistant"><SiteAssistant /></div>
    </div>
  );
};
