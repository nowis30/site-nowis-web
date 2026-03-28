import { redirect } from 'next/navigation';
import { getClientPortalSessionServer } from '@/features/client-portal/auth/session';

export default async function PublicClientAccessPage() {
  const session = await getClientPortalSessionServer();

  if (session) {
    redirect('/client/dashboard');
  }

  redirect('/connexion');
}
