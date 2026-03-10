import { redirect } from 'next/navigation';

export const metadata = {
  title: 'À propos — Nowis Morin',
  description: 'Redirection vers la page À propos de Nowis Morin.',
};

export default function AboutPage() {
  redirect('/a-propos');
}
