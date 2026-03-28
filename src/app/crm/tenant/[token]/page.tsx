import { verifyTenantPortalToken } from '@/lib/client-portal';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';
import { TenantFileUploadForm, TenantPortalDeleteFileButton } from '@/features/crm/components/tenant-portal/TenantFileUploadForm';
import { InvoicePaymentNoticeForm } from '@/features/crm/components/portals/InvoicePaymentNoticeForm';
import { TenantMaintenanceRequestForm } from '@/features/crm/components/tenant-portal/TenantMaintenanceRequestForm';
import { PortalMessageForm } from '@/features/crm/components/portals/PortalMessageForm';

interface PageProps {
  params: { token: string };
}

function formatDate(value: Date | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-CA');
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString('fr-CA');
}

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
};

const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
};

const BOOKING_BASE_URL = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL?.trim() || 'https://cal.com/simon-nowis-morin/30min';
const BOOKING_URL = BOOKING_BASE_URL.includes('?') ? `${BOOKING_BASE_URL}&embed=true` : `${BOOKING_BASE_URL}?embed=true`;

export default async function TenantPortalPage({ params }: PageProps) {
  const session = verifyTenantPortalToken(params.token);

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <h1 className="text-3xl font-semibold">Lien locataire invalide</h1>
          <p className="mt-3 text-sm text-slate-300">
            Ce lien est expiré ou incorrect. Contactez la gestion pour obtenir un nouvel accès.
          </p>
        </div>
      </main>
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: session.tenantId,
      contactId: session.contactId,
    },
    select: {
      id: true,
      isActive: true,
      moveInDate: true,
      moveOutDate: true,
      emergencyContact: true,
      emergencyPhone: true,
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          invoices: {
            orderBy: { issueDate: 'desc' },
            select: {
              id: true,
              number: true,
              issueDate: true,
              dueDate: true,
              amount: true,
              status: true,
              description: true,
              fileUrl: true,
            },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
              type: true,
            },
          },
        },
      },
      unit: {
        select: {
          id: true,
          unitNumber: true,
          floor: true,
          monthlyRent: true,
          property: {
            select: {
              name: true,
              code: true,
              addressLine1: true,
              city: true,
              province: true,
            },
          },
        },
      },
      leases: {
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          leaseNumber: true,
          startDate: true,
          endDate: true,
          rentAmount: true,
          status: true,
          frequency: true,
        },
      },
      maintenanceTickets: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!tenant) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <h1 className="text-3xl font-semibold">Dossier locataire introuvable</h1>
          <p className="mt-3 text-sm text-slate-300">
            Aucun dossier n’est disponible pour ce lien.
          </p>
        </div>
      </main>
    );
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { linkedType: 'TENANT', linkedId: tenant.id },
        { linkedType: 'CONTACT', linkedId: tenant.contact.id },
        { caseRecord: { contactId: tenant.contact.id } },
      ],
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 30,
  });

  const tenantDocuments = await prisma.document.findMany({
    where: { linkedType: 'TENANT', linkedId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const invoiceDocuments = tenant.contact.invoices.length === 0
    ? []
    : await prisma.document.findMany({
        where: {
          linkedType: 'INVOICE',
          linkedId: { in: tenant.contact.invoices.map((invoice) => invoice.id) },
        },
        orderBy: { createdAt: 'desc' },
      });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[28px] border border-cyan-400/20 bg-slate-900/75 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Portail locataire</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Bonjour {tenant.contact.fullName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cet espace affiche uniquement votre dossier locataire, vos tâches de suivi et vos factures.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              <p>{tenant.contact.email || session.email}</p>
              <p>{tenant.contact.phone || 'Téléphone non renseigné'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Dossier</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Votre location</h2>
            </div>
            <StatusBadge value={tenant.isActive ? 'ACTIVE' : 'INACTIVE'} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 lg:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Logement</p>
              {tenant.unit ? (
                <dl className="mt-3 grid gap-3 text-sm text-slate-200 md:grid-cols-2">
                  <div><dt className="text-slate-500">Immeuble</dt><dd>{tenant.unit.property.name}</dd></div>
                  <div><dt className="text-slate-500">Code</dt><dd>{tenant.unit.property.code}</dd></div>
                  <div><dt className="text-slate-500">Unité</dt><dd>{tenant.unit.unitNumber}</dd></div>
                  <div><dt className="text-slate-500">Étage</dt><dd>{tenant.unit.floor || '—'}</dd></div>
                  <div><dt className="text-slate-500">Adresse</dt><dd>{tenant.unit.property.addressLine1}</dd></div>
                  <div><dt className="text-slate-500">Ville</dt><dd>{tenant.unit.property.city}, {tenant.unit.property.province}</dd></div>
                  <div><dt className="text-slate-500">Loyer mensuel</dt><dd>{formatCurrency(tenant.unit.monthlyRent === null ? null : Number(tenant.unit.monthlyRent))}</dd></div>
                  <div><dt className="text-slate-500">Entrée</dt><dd>{formatDate(tenant.moveInDate)}</dd></div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Aucun logement assigné pour le moment.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Urgence</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p><span className="text-slate-500">Contact :</span> {tenant.emergencyContact || '—'}</p>
                <p><span className="text-slate-500">Téléphone :</span> {tenant.emergencyPhone || '—'}</p>
                <p><span className="text-slate-500">Sortie prévue :</span> {formatDate(tenant.moveOutDate)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Baux</p>
              <div className="mt-4 space-y-3">
                {tenant.leases.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun bail visible pour le moment.</p>
                ) : (
                  tenant.leases.map((lease) => (
                    <article key={lease.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">Bail {lease.leaseNumber}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(lease.startDate)} au {formatDate(lease.endDate)}
                          </p>
                        </div>
                        <StatusBadge value={lease.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatCurrency(Number(lease.rentAmount))} · {lease.frequency}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Activité récente</p>
              <div className="mt-4 space-y-3">
                {tenant.contact.activities.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune activité visible pour le moment.</p>
                ) : (
                  tenant.contact.activities.map((activity) => (
                    <article key={activity.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      {activity.description ? <p className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">{activity.description}</p> : null}
                      <p className="mt-2 text-xs text-slate-500">{formatDateTime(activity.createdAt)}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Documents</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Fichiers partagés</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="space-y-3">
                {tenantDocuments.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun document visible pour le moment.</p>
                ) : (
                  tenantDocuments.map((file) => (
                    <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <a href={file.fileUrl} target="_blank" rel="noreferrer" className="block hover:text-cyan-200">
                        <p className="text-sm font-medium text-white">{file.fileName}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(file.createdAt)}</p>
                      </a>
                      <div className="mt-2"><TenantPortalDeleteFileButton token={params.token} fileId={file.id} /></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <TenantFileUploadForm token={params.token} />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Tâches</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Suivi et demandes</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune tâche visible pour le moment.</p>
                ) : (
                  tasks.map((task) => (
                    <article key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      {task.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{task.description}</p> : null}
                      <p className="mt-2 text-xs text-slate-500">
                        {TASK_STATUS_LABELS[task.status] ?? task.status} · {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                        {task.dueDate ? ` · ${formatDate(task.dueDate)}` : ''}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-cyan-200">Rendez-vous</p>
              <p className="mt-2 text-sm text-cyan-100">
                Pour planifier un échange, utilisez uniquement les plages horaires libres du calendrier.
              </p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
              >
                Prendre rendez-vous
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Messages</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Communiquer avec la gestion</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="space-y-3">
                {tenant.contact.activities.filter((activity) => activity.type === 'MESSAGE').length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun message visible pour le moment.</p>
                ) : (
                  tenant.contact.activities.filter((activity) => activity.type === 'MESSAGE').map((activity) => (
                    <article key={activity.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      {activity.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{activity.description}</p> : null}
                      <p className="mt-2 text-xs text-slate-500">{formatDateTime(activity.createdAt)}</p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <PortalMessageForm
              actionUrl="/api/tenant-portal/messages"
              subjectPlaceholder="Objet du message"
              buttonLabel="Envoyer le message"
              extraPayload={{ token: params.token }}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Maintenance</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Demandes de maintenance</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="space-y-3">
                {tenant.maintenanceTickets.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune demande visible pour le moment.</p>
                ) : (
                  tenant.maintenanceTickets.map((ticket) => (
                    <article key={ticket.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-white">{ticket.title}</p>
                        <StatusBadge value={ticket.status} />
                      </div>
                      {ticket.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{ticket.description}</p> : null}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDate(ticket.createdAt)}</span>
                        <StatusBadge value={ticket.priority} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <TenantMaintenanceRequestForm token={params.token} />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Factures</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Vos factures</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {tenant.contact.invoices.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune facture visible pour le moment.</p>
            ) : (
              tenant.contact.invoices.map((invoice) => (
                <article key={invoice.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Facture {invoice.number}</p>
                      {invoice.description ? <p className="mt-1 text-sm text-slate-300">{invoice.description}</p> : null}
                    </div>
                    <div className="text-sm text-slate-200">
                      <p>{formatCurrency(Number(invoice.amount))}</p>
                      <div className="text-xs text-slate-500"><StatusBadge value={invoice.status} /></div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Émise le {formatDate(invoice.issueDate)}</span>
                    <span>Échéance {formatDate(invoice.dueDate)}</span>
                    {invoice.fileUrl ? (
                      <a href={invoice.fileUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
                        Ouvrir le fichier
                      </a>
                    ) : (
                      <a href={`/crm/tenant/${params.token}/invoices/${invoice.id}`} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
                        Ouvrir la version imprimable
                      </a>
                    )}
                  </div>
                  {invoiceDocuments.filter((document) => document.linkedId === invoice.id).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {invoiceDocuments.filter((document) => document.linkedId === invoice.id).map((document) => (
                        <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="block text-xs text-slate-400 hover:text-cyan-200">
                          Justificatif: {document.fileName}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <InvoicePaymentNoticeForm
                    actionUrl={`/api/tenant-portal/invoices/${invoice.id}/payment?token=${encodeURIComponent(params.token)}`}
                    buttonLabel="Signaler le paiement"
                  />
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}