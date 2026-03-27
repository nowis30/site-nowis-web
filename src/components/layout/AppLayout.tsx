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
import { StarfieldBackground } from './StarfieldBackground';

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
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-transparent text-slate-100 isolate">
      <StarfieldBackground />
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
