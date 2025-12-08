import type { Metadata } from 'next';
import { CampagnesReseauxSociauxScreen } from '@/screens/services/CampagnesReseauxSociauxScreen';

export const metadata: Metadata = {
  title: 'Campagnes réseaux sociaux – Création NOWIS',
  description: 'Campagnes complètes : visuels, textes, vidéos optimisés pour Facebook, Instagram, TikTok.',
};

export default function CampagnesPage() {
  return <CampagnesReseauxSociauxScreen />;
}
