/**
 * AppLayout Component
 * Layout wrapper pour l'application complète (Header + contenu + Footer).
 * UTILISATION: Enveloppe toutes tes pages avec ce layout.
 */

'use client';

import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header - Navigation */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
