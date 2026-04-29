import { redirect } from 'next/navigation';

export default function LegacyClientLoginPage() {
  redirect('/connexion?next=/client/dashboard');
}
