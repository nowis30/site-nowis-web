import Link from 'next/link';
import { User } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { ClientBillingForm } from '@/features/client-portal/components/ClientBillingForm';
import { PageHeader, SectionCard } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';

export default async function ClientProfilePage() {
  const session = await requireClientPortalSession();

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      notes: true,
      profileMeta: true,
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
          <PageHeader title="Profil" subtitle="Vos informations personnelles et de facturation" />
          <div className="rounded-2xl border border-red-800/40 bg-red-950/20 p-5 text-sm text-red-200">
            Impossible de charger votre dossier. Veuillez vous reconnecter.
          </div>
        </section>
      );
  }

  return (
    <section className="space-y-6">
      <PageHeader
          title="Profil"
          subtitle="Gérez vos informations personnelles, coordonnées et adresse de facturation pour vos demandes et factures."
      />

      <SectionCard title="Compte client" subtitle="Informations associées à votre compte.">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-500/20 p-2">
              <User className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{contact.fullName}</p>
              <p className="text-xs text-slate-400">{contact.email}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Coordonnées de facturation"
        subtitle="Ces informations apparaissent sur vos factures et contrats. Les champs marqués * sont obligatoires."
      >
        <div className="mt-6">
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
          />
        </div>
      </SectionCard>

          <SectionCard
            title="Paiements"
            subtitle="Méthodes de paiement et historique."
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-slate-300">Les méthodes de paiement seront disponibles bientôt.</p>
                  <p className="mt-2 text-xs text-slate-500">Actuellement, les factures sont payées par transfert bancaire ou PayPal selon les modalités convenues.</p>
                </div>
                <div className="shrink-0 rounded-lg bg-slate-900/60 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  À venir
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="text-center">
            <Link href="/client/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">
              ← Retour au tableau de bord
            </Link>
          </div>
    </section>
  );
}
