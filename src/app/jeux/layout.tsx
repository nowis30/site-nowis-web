import type { ReactNode } from 'react';
import { JeuxShell } from '@/components/jeux/JeuxShell';

type JeuxLayoutProps = {
  children: ReactNode;
};

export default function JeuxLayout({ children }: JeuxLayoutProps) {
  return <JeuxShell>{children}</JeuxShell>;
}