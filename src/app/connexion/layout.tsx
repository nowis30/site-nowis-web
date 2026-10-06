// CSP nonces require rendering private HTML for each request.
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion au portail client | Création Nowis',
  description: 'Connexion au portail client sécurisé de Création Nowis.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}