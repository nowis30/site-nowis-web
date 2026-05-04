import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader } from '@/features/client-portal/components/ui';
import { SongRequestForm } from '@/components/forms/SongRequestForm';
import { prisma } from '@/lib/prisma';

export default async function NouvelleDemandePortalPage() {
  const session = await requireClientPortalSession();

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
          title="Nouvelle demande de chanson"
          subtitle="Remplis le formulaire, puis envoie."
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
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <FileText className="h-5 w-5 shrink-0" />
            <h2 className="text-base font-semibold">Informations de facturation requises</h2>
          </div>
          <p className="text-sm text-amber-100 leading-relaxed">
            Avant de soumettre une demande de chanson, veuillez d&apos;abord compléter votre profil de facturation.
            Ces informations sont nécessaires pour établir votre contrat et votre facture.
          </p>
          <Link
            href="/client/facturation?next=/client/song-requests/nouveau"
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
        title="Nouvelle demande de chanson"
        subtitle="Remplis le formulaire, puis envoie."
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
