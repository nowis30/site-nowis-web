import type { ReactNode } from 'react';
import { NowisRadio } from '@/components/jeux/NowisRadio';

type JeuxLayoutProps = {
  children: ReactNode;
};

export default function JeuxLayout({ children }: JeuxLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-40">
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto w-[calc(100vw-2rem)] max-w-3xl md:left-auto md:right-4 md:w-[min(32rem,calc(100vw-2rem))]">
        <NowisRadio />
      </div>
    </div>
  );
}