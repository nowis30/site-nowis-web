import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader } from '@/features/client-portal/components/ui';
import { WorkshopRequestForm } from '@/features/workshops/components/WorkshopRequestForm';
import { prisma } from '@/lib/prisma';

export default async function NouvelleDemandeAtelierPage() {
  const session = await requireClientPortalSession();

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: { phone: true },
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Nouvelle demande d'atelier"
        subtitle="Remplissez ce formulaire depuis votre portail. La demande sera liee automatiquement a votre dossier client."
        actions={
          <Link
            href="/client/workshops"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        }
      />

      <WorkshopRequestForm
        accountEmail={session.email}
        accountFullName={session.fullName}
        accountPhone={contact?.phone ?? ''}
      />
    </section>
  );
}
