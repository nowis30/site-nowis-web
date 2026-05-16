import { redirect } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Parler de mon projet — Nowis Morin',
  description: 'Parle de ton projet avec Nowis Morin pour préparer une chanson, un atelier, une vidéo ou une collaboration créative.',
  path: '/booking',
});

export default function BookingPage() {
  redirect('/contact?projectType=autre&message=Bonjour%2C%20je%20veux%20discuter%20de%20mon%20projet%20avec%20Cr%C3%A9ation%20Nowis.');
}

