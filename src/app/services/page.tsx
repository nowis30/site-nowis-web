import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Services - NOWIS',
  description: 'Cette page a été retirée. Découvrez nos projets dans le portfolio.',
};

export default function ServicesPage() {
  redirect('/');
}
