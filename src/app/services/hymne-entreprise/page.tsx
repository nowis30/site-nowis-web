import type { Metadata } from 'next';
import { HymneEntrepriseScreen } from '@/screens/services/HymneEntrepriseScreen';

export const metadata: Metadata = {
  title: 'Hymne d\'entreprise – Création NOWIS',
  description: 'Création de chansons-thèmes et hymnes d\'entreprise pour renforcer votre identité de marque.',
};

export default function HymneEntreprisePage() {
  return <HymneEntrepriseScreen />;
}
