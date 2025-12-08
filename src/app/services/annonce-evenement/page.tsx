import type { Metadata } from 'next';
import { AnnonceEvenementScreen } from '@/screens/services/AnnonceEvenementScreen';

export const metadata: Metadata = {
  title: 'Annonces d\'événements – Création NOWIS',
  description: 'Promotion d\'événements : vidéos, visuels et textes pour maximiser l\'audience.',
};

export default function AnnonceEvenementPage() {
  return <AnnonceEvenementScreen />;
}
