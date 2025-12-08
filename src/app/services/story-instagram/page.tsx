import type { Metadata } from 'next';
import { StoryInstagramScreen } from '@/screens/services/StoryInstagramScreen';

export const metadata: Metadata = {
  title: 'Stories Instagram – Création NOWIS',
  description: 'Packs de stories Instagram animées et engageantes pour captiver vos followers.',
};

export default function StoryInstagramPage() {
  return <StoryInstagramScreen />;
}
