import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader } from '@/features/client-portal/components/ui';
import { SongRequestForm } from '@/components/forms/SongRequestForm';
import { prisma } from '@/lib/prisma';
import { isClientBillingComplete } from '@/lib/client-billing';

const backLinkClassName =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none sm:w-auto';

export default async function NouvelleDemandePortalPage() {
  const session = await requireClientPortalSession();

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      phone: true,
      billingLegalName: true,
      billingEmail: true,
      billingAddressLine1: true,
      billingCity: true,
      billingState: true,
      billingPostalCode: true,
      billingCountry: true,
    },
  });

  const billingComplete = isClientBillingComplete({
    fullName: session.fullName,
    email: session.email,
    phone: contact?.phone,
    billingLegalName: contact?.billingLegalName,
    billingEmail: contact?.billingEmail,
    billingAddressLine1: contact?.billingAddressLine1,
    billingCity: contact?.billingCity,
    billingState: contact?.billingState,
    billingPostalCode: contact?.billingPostalCode,
    billingCountry: contact?.billingCountry,
  });

  const backAction = (
    <Link href="/client/song-requests" className={backLinkClassName}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Retour aux demandes
    </Link>
  );

  if (!billingComplete) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Nouvelle demande de chanson"
          subtitle="Complétez d’abord vos informations de facturation, puis revenez ici pour lancer votre création."
          actions={backAction}
        />

        <section
          className="crm-surface overflow-hidden rounded-3xl border border-amber-400/25 p-5 shadow-[0_12px_34px_rgba(2,6,23,0.26)] sm:p-7"
          aria-labelledby="billing-required-title"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-200" aria-hidden="true">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">Étape requise</p>
              <h2 id="billing-required-title" className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
                Informations de facturation requises
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Votre profil de facturation doit être complété avant de créer une demande. Ces informations servent à préparer votre contrat et votre facture correctement.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/client/facturation?next=/client/song-requests/nouveau"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none sm:w-auto"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Compléter mes informations
            </Link>
            <Link href="/client/dashboard" className={backLinkClassName}>
              Retour au tableau de bord
            </Link>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Nouvelle demande de chanson"
        subtitle="Décrivez l’occasion et l’ambiance souhaitée. Vous pourrez suivre la demande depuis votre portail."
        actions={backAction}
      />

      <SongRequestForm
        defaultFullName={session.fullName}
        defaultEmail={session.email}
        defaultPhone={contact?.phone ?? ''}
      />
    </section>
  );
}
