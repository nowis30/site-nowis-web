/**
 * AppLayout Component
 * Layout wrapper pour l'application complète (Header + contenu + Footer).
 * UTILISATION: Enveloppe toutes tes pages avec ce layout.
 */

'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith('/crm') || pathname.startsWith('/client');

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <div className="public-site site-background relative flex min-h-screen flex-col overflow-x-clip text-[color:var(--site-text)] isolate">
      {/* Header - Navigation */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-grow">
        {children}
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};
