import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/contact?projectType=atelier&message=Bonjour%2C%20je%20veux%20planifier%20un%20atelier.');
}
