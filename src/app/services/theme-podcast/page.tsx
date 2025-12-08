import type { Metadata } from 'next';
import { ThemePodcastScreen } from '@/screens/services/ThemePodcastScreen';

export const metadata: Metadata = {
  title: 'Thème de podcast – Création NOWIS',
  description: 'Création de thèmes musicaux, jingles et identité sonore pour votre podcast.',
};

export default function ThemePodcastPage() {
  return <ThemePodcastScreen />;
}
