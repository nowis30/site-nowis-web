import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader } from '@/features/client-portal/components/ui';
import { SongRequestForm } from '@/components/forms/SongRequestForm';
import { prisma } from '@/lib/prisma';

export default async function NouvelleDemandePortalPage() {
  const session = await requireClientPortalSession();

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: { phone: true },
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Nouvelle demande de chanson"
        subtitle="Remplis le formulaire ci-dessous. Ta demande sera automatiquement liée à ton dossier client."
        actions={
          <Link
            href="/client/song-requests"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        }
      />

      <SongRequestForm
        defaultFullName={session.fullName}
        defaultEmail={session.email}
        defaultPhone={contact?.phone ?? ''}
      />
    </section>
  );
}
