import { redirect } from 'next/navigation';
import { getClientPortalSessionServer } from '@/features/client-portal/auth/session';

export default async function ClientRootPage() {
  const session = await getClientPortalSessionServer();
  if (session) {
    redirect('/client/dashboard');
  }
  redirect('/connexion');
}
