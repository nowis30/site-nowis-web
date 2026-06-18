import type { ReactNode } from 'react';
import { NowisRadioPanel } from '@/components/jeux/NowisRadio';

type JeuxLayoutProps = {
  children: ReactNode;
};

export default function JeuxLayout({ children }: JeuxLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}
      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 md:px-6 md:pb-10">
        <div className="mb-4 border-t border-sky-400/10 pt-6 text-xs uppercase tracking-[0.28em] text-slate-400">
          Radio NOWIS
        </div>
        <NowisRadioPanel compact />
      </footer>
    </div>
  );
}