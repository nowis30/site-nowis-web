import type { ReactNode } from 'react';
import { NowisRadioPanel } from '@/components/jeux/NowisRadio';

type JeuxLayoutProps = {
  children: ReactNode;
};

export default function JeuxLayout({ children }: JeuxLayoutProps) {
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