import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Service retiré - Création NOWIS',
  description: 'Cette page n’est plus disponible. Découvrez nos projets dans le portfolio.',
};

export default function ClipVideoPage() {
  redirect('/');
}
