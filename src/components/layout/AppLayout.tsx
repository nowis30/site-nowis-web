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
      <div><Header /></div>
      <main className="relative z-0 flex-grow pt-24 md:pt-[7.5rem] min-[1200px]:pt-28">{children}</main>
      <div className="relative z-0"><Footer /></div>
      <div className="nowis-site-assistant"><SiteAssistant /></div>
    </div>
  );
};
