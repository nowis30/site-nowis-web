/**
 * Page Jeux - Accès aux applications de jeux NOWIS
 */

import { JeuxScreen } from '@/screens/JeuxScreen';

export const metadata = {
  title: 'Jeux – NOWIS',
  description: 'Découvre Héritier Millionnaire, le jeu NOWIS de finances personnelles, immobilier, bourse, quiz et mini-jeux, avec un accès rapide depuis le site.',
};

export default function JeuxPage() {
  return <JeuxScreen />;
}
