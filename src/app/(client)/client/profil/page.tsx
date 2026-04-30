import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { ClientProfileCompletionForm } from '@/features/client-portal/components/ClientProfileCompletionForm';
import { readClientProfileMeta } from '@/features/client-portal/profile';
import { PageHeader, SectionCard } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';

export default async function ClientProfilePage() {
  const session = await requireClientPortalSession();

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      notes: true,
    },
  });

  if (!contact) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-200">Contact introuvable.</div>;
  }

  const meta = readClientProfileMeta(contact.notes);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Completer vos informations"
        subtitle="Pour finaliser votre inscription Google, merci de renseigner vos coordonnees de contact et vos adresses de reference."
      />

      <SectionCard title="Coordonnees client" subtitle={`Bonjour ${contact.fullName}, ces informations aident notre equipe CRM a traiter vos demandes rapidement.`}>
        <div className="mt-6">
          <ClientProfileCompletionForm
            initial={{
              phone: contact.phone || '',
              billingAddress: meta?.billingAddress || '',
              requestPostalAddress: meta?.requestPostalAddress || '',
              requestType: meta?.requestType || 'ATELIER_ET_CHANSON',
            }}
          />
        </div>
      </SectionCard>
    </section>
  );
}
