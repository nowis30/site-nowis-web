import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader, SectionCard } from '@/features/client-portal/components/ui';
import { ClientBillingForm } from '@/features/client-portal/components/ClientBillingForm';
import { prisma } from '@/lib/prisma';

export default async function ClientFacturationPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await requireClientPortalSession();
  const nextUrl = typeof searchParams?.next === 'string' ? searchParams.next : undefined;

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      billingLegalName: true,
      billingCompanyName: true,
      billingEmail: true,
      billingPhone: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingCity: true,
      billingState: true,
      billingPostalCode: true,
      billingCountry: true,
      billingTaxId: true,
    },
  });

  if (!contact) {
    return (
      <section className="space-y-6">
        <PageHeader title="Facturation" subtitle="Vos informations de facturation" />
        <div className="rounded-2xl border border-red-800/40 bg-red-950/20 p-5 text-sm text-red-200">
          Impossible de charger votre dossier. Veuillez vous reconnecter.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Informations de facturation"
        subtitle="Ces informations apparaissent sur vos factures. Elles sont requises avant toute demande."
        actions={
          nextUrl ? null : (
            <Link
              href="/client/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </Link>
          )
        }
      />

      {nextUrl ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-700/40 bg-amber-950/20 px-4 py-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            Avant de soumettre votre demande, veuillez compléter vos informations de facturation. Elles sont nécessaires pour établir votre contrat et votre facture.
          </p>
        </div>
      ) : null}

      <SectionCard
        title="Profil de facturation"
        subtitle="Les champs marqués * sont obligatoires pour finaliser une soumission ou une facture."
      >
        <div className="mt-4">
          <ClientBillingForm
            initial={{
              id: contact.id,
              fullName: contact.fullName,
              email: contact.email ?? session.email,
              billingLegalName: contact.billingLegalName,
              billingCompanyName: contact.billingCompanyName,
              billingEmail: contact.billingEmail,
              billingPhone: contact.billingPhone,
              billingAddressLine1: contact.billingAddressLine1,
              billingAddressLine2: contact.billingAddressLine2,
              billingCity: contact.billingCity,
              billingState: contact.billingState,
              billingPostalCode: contact.billingPostalCode,
              billingCountry: contact.billingCountry,
              billingTaxId: contact.billingTaxId,
            }}
            nextUrl={nextUrl}
          />
        </div>
      </SectionCard>
    </section>
  );
}
