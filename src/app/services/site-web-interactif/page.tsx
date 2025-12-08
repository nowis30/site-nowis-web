import type { Metadata } from 'next';
import { SiteWebInteractifScreen } from '@/screens/services/SiteWebInteractifScreen';

export const metadata: Metadata = {
  title: 'Sites web interactifs – Création NOWIS',
  description: 'Création de sites web modernes, vitrines d\'entreprise et landing pages avec intégration IA.',
};

export default function SiteWebInteractifPage() {
  return <SiteWebInteractifScreen />;
}
