import type { Metadata } from 'next';
import { ExemplesProjetsScreen } from '@/screens/services/ExemplesProjetsScreen';

export const metadata: Metadata = {
  title: 'Exemples de projets – Création NOWIS',
  description: 'Découvrez les types de projets et créations que Création NOWIS peut réaliser pour vous.',
};

export default function ExemplesProjetsPage() {
  return <ExemplesProjetsScreen />;
}
