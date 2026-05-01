import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CrmDetailCard } from '@/features/crm/components/shared/CrmDetailCard';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';
import { OrganizationEditButton } from '@/features/crm/components/organizations/OrganizationEditButton';

type OrganizationDetailRecord = Prisma.OrganizationGetPayload<{
  include: {
    contacts: true;
    workshopRequests: true;
    workshopAppointments: true;
  };
}>;

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  await requireCrmSession();

  let item: OrganizationDetailRecord | null = null;
  try {
    item = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        workshopRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        workshopAppointments: { orderBy: { startAt: 'desc' }, take: 20 },
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  if (!item) notFound();

  return (
    <section className="space-y-6">
      <CrmDetailCard
        title={item.name}
        backHref="/crm/organizations"
        backLabel="Organisations"
        badge={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={item.status} />
            <OrganizationEditButton organization={{ id: item.id, name: item.name, type: item.type, status: item.status, email: item.email, phone: item.phone, address: item.address, city: item.city, notes: item.notes }} />
          </div>
        }
        sections={[
          {
            title: 'Organisation',
            fields: [
              { label: 'Type', value: <StatusBadge value={item.type} /> },
              { label: 'Email', value: item.email || '—' },
              { label: 'Téléphone', value: item.phone || '—' },
              { label: 'Ville', value: item.city || '—' },
              { label: 'Adresse', value: item.address || '—' },
              { label: 'Créée le', value: formatDate(item.createdAt) },
            ],
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold text-white">Contacts associés</h3>
          <div className="mt-4 space-y-3">
            {item.contacts.length === 0 ? <p className="text-sm text-slate-400">Aucun contact lié.</p> : item.contacts.map((contact: OrganizationDetailRecord['contacts'][number]) => (
              <article key={contact.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{contact.fullName}</p>
                  {contact.isPrimary ? <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-[11px] text-primary-200">Principal</span> : null}
                </div>
                <p className="mt-2 text-slate-400">{contact.role || 'Contact organisation'}</p>
                <p className="mt-1 text-slate-400">{contact.email || '—'} · {contact.phone || '—'}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold text-white">Demandes d’atelier</h3>
          <div className="mt-4 space-y-3">
            {item.workshopRequests.length === 0 ? <p className="text-sm text-slate-400">Aucune demande d’atelier.</p> : item.workshopRequests.map((request: OrganizationDetailRecord['workshopRequests'][number]) => (
              <article key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{request.title}</p>
                  <StatusBadge value={request.status} />
                </div>
                <p className="mt-2 text-slate-400">{request.workshopTheme}</p>
                <div className="mt-3"><Link href={`/crm/workshop-requests/${request.id}`} className="text-primary-300 hover:text-primary-200">Ouvrir la demande</Link></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
