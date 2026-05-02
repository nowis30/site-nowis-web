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
    contacts: {
      include: {
        contact: {
          select: {
            id: true;
            fullName: true;
            email: true;
            phone: true;
          };
        };
      };
    };
    workshopRequests: true;
    workshopAppointments: true;
    appointments: true;
    songRequests: true;
  };
}>;

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function buildOutlookHref(email: string) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
}

function buildTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

export default async function OrganizationDetailPage({ params }: { params: { id: string } }) {
  await requireCrmSession();

  let item: OrganizationDetailRecord | null = null;
  try {
    item = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        workshopRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        workshopAppointments: { orderBy: { startAt: 'desc' }, take: 20 },
        appointments: { orderBy: { startAt: 'desc' }, take: 30 },
        songRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  if (!item) notFound();

  const primaryContact = item.contacts[0] || null;

  return (
    <section className="space-y-6">
      <CrmDetailCard
        title={item.name}
        backHref="/crm/organizations"
        backLabel="Organisations"
        badge={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={item.type} />
            <StatusBadge value={item.status} />
            <OrganizationEditButton organization={{ id: item.id, name: item.name, type: item.type, status: item.status, email: item.email, phone: item.phone, address: item.address, city: item.city, notes: item.notes }} />
          </div>
        }
        sections={[
          {
            title: 'Organisation',
            fields: [
              { label: 'Courriel principal', value: item.email ? <a href={buildOutlookHref(item.email)} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200">{item.email}</a> : '—' },
              { label: 'Téléphone principal', value: item.phone ? <a href={buildTelHref(item.phone)} className="text-primary-300 hover:text-primary-200">{item.phone}</a> : '—' },
              { label: 'Ville', value: item.city || '—' },
              { label: 'Adresse', value: item.address || '—' },
              { label: 'Site web', value: 'Champ non disponible dans le modèle actuel' },
              { label: 'Responsable principal', value: primaryContact?.contact?.id ? <Link href={`/crm/contacts/${primaryContact.contact.id}`} className="text-primary-300 hover:text-primary-200">{primaryContact.fullName}</Link> : primaryContact?.fullName || '—' },
              { label: 'Notes internes', value: item.notes || '—' },
              { label: 'Créée le', value: formatDate(item.createdAt) },
            ],
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <a href={item.email ? buildOutlookHref(item.email) : '#'} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Envoyer un courriel</a>
        <a href={item.phone ? buildTelHref(item.phone) : '#'} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Appeler</a>
        <Link href={`/crm/commercial-quotes/new?organizationId=${item.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Créer une soumission</Link>
        <Link href={`/crm/workshop-requests/create?organizationId=${item.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Créer un atelier</Link>
        <Link href={`/crm/calendar?organizationId=${item.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Planifier un rendez-vous</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Contacts liés</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.contacts.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {item.contacts.length === 0 ? <p className="text-sm text-slate-400">Aucun contact lié.</p> : item.contacts.map((contact) => (
              <article key={contact.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  {contact.contact?.id ? <Link href={`/crm/contacts/${contact.contact.id}`} className="font-medium text-white hover:text-primary-200">{contact.fullName}</Link> : <p className="font-medium text-white">{contact.fullName}</p>}
                  {contact.isPrimary ? <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-[11px] text-primary-200">Principal</span> : null}
                </div>
                <p className="mt-2 text-slate-400">{contact.role || 'Contact organisation'}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                  {contact.email ? <a href={buildOutlookHref(contact.email)} target="_blank" rel="noreferrer" className="hover:text-white">{contact.email}</a> : <span>—</span>}
                  {contact.phone ? <a href={buildTelHref(contact.phone)} className="hover:text-white">{contact.phone}</a> : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Ateliers liés</h3>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.workshopRequests.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {item.workshopRequests.length === 0 ? <p className="text-sm text-slate-400">Aucun atelier lié.</p> : item.workshopRequests.map((request) => (
              <article key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/crm/workshop-requests/${request.id}`} className="font-medium text-white hover:text-primary-200">{request.title}</Link>
                  <StatusBadge value={request.status} />
                </div>
                <p className="mt-2 text-slate-400">{request.workshopTheme}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/crm/workshop-requests/${request.id}`} className="rounded-md border border-primary-500/40 px-2 py-1 text-xs text-primary-200 hover:text-white">Voir l’atelier</Link>
                  <Link href={`/crm/calendar?organizationId=${item.id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white">Planifier</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Rendez-vous liés</h3>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.appointments.length + item.workshopAppointments.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {item.appointments.length === 0 ? null : item.appointments.map((appointment) => (
            <article key={appointment.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{appointment.title}</p>
                <StatusBadge value={appointment.status} />
              </div>
              <p className="mt-2 text-slate-400">{formatDateTime(appointment.startAt)}</p>
              {appointment.location ? <p className="mt-1 text-slate-500">{appointment.location}</p> : null}
            </article>
          ))}
          {item.workshopAppointments.length === 0 ? <p className="text-sm text-slate-400">Aucun rendez-vous atelier lié.</p> : item.workshopAppointments.map((appointment) => (
            <article key={appointment.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{appointment.title}</p>
                <StatusBadge value={appointment.status} />
              </div>
              <p className="mt-2 text-slate-400">{formatDateTime(appointment.startAt)}</p>
              {appointment.location ? <p className="mt-1 text-slate-500">{appointment.location}</p> : null}
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Demandes chanson liées</h3>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.songRequests.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {item.songRequests.length === 0 ? <p className="text-sm text-slate-400">Aucune demande de chanson liée.</p> : item.songRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/crm/song-requests/${request.id}`} className="font-medium text-white hover:text-primary-200">{request.title || request.occasion}</Link>
                <StatusBadge value={request.status} />
              </div>
              <p className="mt-2 text-slate-400">Date rencontre: {formatDateTime(request.meetingDate || request.startAt)}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-5 py-4 text-sm text-slate-400">
        Les factures et soumissions commerciales ne sont pas encore reliées directement au modèle organisation. Pour l’instant, elles passent par les contacts liés.
      </div>
    </section>
  );
}
