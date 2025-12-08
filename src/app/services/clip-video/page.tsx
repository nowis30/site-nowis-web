import type { Metadata } from 'next';
import { ClipVideoScreen } from '@/screens/services/ClipVideoScreen';

export const metadata: Metadata = {
  title: 'Clips vidéo sur mesure – Création NOWIS',
  description: 'Création de clips vidéo avec musique IA, montage professionnel pour réseaux sociaux et entreprises.',
};

export default function ClipVideoPage() {
  return <ClipVideoScreen />;
}
