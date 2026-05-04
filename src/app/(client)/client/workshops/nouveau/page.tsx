import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader } from '@/features/client-portal/components/ui';
import { WorkshopRequestForm } from '@/features/workshops/components/WorkshopRequestForm';
import { prisma } from '@/lib/prisma';

const GROUP_TYPES = new Set(['AINES_RESIDENCE', 'ECOLE', 'ENTREPRISE', 'COMMUNAUTAIRE', 'PRIVE', 'AUTRE']);

export default async function NouvelleDemandeAtelierPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await requireClientPortalSession();
  const groupTypeParam = typeof searchParams?.groupType === 'string' ? searchParams.groupType : '';
  const initialGroupType = GROUP_TYPES.has(groupTypeParam) ? groupTypeParam : 'ECOLE';

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      phone: true,
      billingAddressLine1: true,
      billingCity: true,
      billingPostalCode: true,
      billingCountry: true,
    },
  });

  const billingComplete =
    !!contact?.billingAddressLine1 &&
    !!contact?.billingCity &&
    !!contact?.billingPostalCode &&
    !!contact?.billingCountry;

  if (!billingComplete) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Nouvelle demande d'atelier"
          subtitle="Remplissez ce formulaire depuis votre portail."
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
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <FileText className="h-5 w-5 shrink-0" />
            <h2 className="text-base font-semibold">Informations de facturation requises</h2>
          </div>
          <p className="text-sm text-amber-100 leading-relaxed">
            Avant de soumettre une demande d&apos;atelier, veuillez d&apos;abord compléter votre profil de facturation.
            Ces informations sont nécessaires pour établir votre contrat et votre facture.
          </p>
          <Link
            href="/client/facturation?next=/client/workshops/nouveau"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
          >
            <FileText className="h-4 w-4" />
            Compléter mon profil de facturation
          </Link>
        </div>
      </section>
    );
  }

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
        initialGroupType={initialGroupType as 'AINES_RESIDENCE' | 'ECOLE' | 'ENTREPRISE' | 'COMMUNAUTAIRE' | 'PRIVE' | 'AUTRE'}
      />
    </section>
  );
}
