import { Suspense } from 'react';
import { ClientLoginCard } from '@/features/client-portal/components/public/ClientLoginCard';

export default function PublicClientAccessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-300">Chargement...</div>}>
      <ClientLoginCard />
    </Suspense>
  );
}
