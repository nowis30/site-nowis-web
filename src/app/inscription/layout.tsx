import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription au portail client | Création Nowis',
  description: 'Création d un accès au portail client sécurisé de Création Nowis.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}