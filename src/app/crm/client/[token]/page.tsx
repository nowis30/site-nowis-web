import Link from 'next/link';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { prisma } from '@/lib/prisma';
import { ClientFileUploadForm, ClientPortalDeleteFileButton } from '@/features/crm/components/client-portal/ClientFileUploadForm';
import { InvoicePaymentNoticeForm } from '@/features/crm/components/portals/InvoicePaymentNoticeForm';
import { PortalMessageForm } from '@/features/crm/components/portals/PortalMessageForm';

interface PageProps {
  params: { token: string };
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle demande',
  CONTACTED: 'Contacté',
  QUOTED: 'Soumission envoyée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
};

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

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
};

const BOOKING_BASE_URL = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL?.trim() || 'https://cal.com/simon-nowis-morin/30min';
const BOOKING_URL = BOOKING_BASE_URL.includes('?') ? `${BOOKING_BASE_URL}&embed=true` : `${BOOKING_BASE_URL}?embed=true`;

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

function formatDate(value: Date | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-CA');
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString('fr-CA');
}

export default async function ClientPortalPage({ params }: PageProps) {
  const session = verifyClientPortalToken(params.token);

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <h1 className="text-3xl font-semibold">Lien client invalide</h1>
          <p className="mt-3 text-sm text-slate-300">
            Ce lien est expiré ou incorrect. Utilisez votre dernier lien reçu ou contactez Nowis.
          </p>
          <Link href="/commander-une-chanson" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900">
            Retour au formulaire
          </Link>
        </div>
      </main>
    );
  }

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          createdAt: true,
        },
      },
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
      songRequests: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          songType: true,
          occasion: true,
          recipientName: true,
          style: true,
          mood: true,
          details: true,
          budget: true,
          desiredDeadline: true,
          status: true,
          convertedAppointmentId: true,
          convertedInvoiceId: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
            },
          },
          tasks: {
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          },
        },
      },
    },
  });

  if (!contact || contact.songRequests.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <h1 className="text-3xl font-semibold">Dossier introuvable</h1>
          <p className="mt-3 text-sm text-slate-300">
            Aucun dossier de chanson n’est disponible pour ce lien.
          </p>
        </div>
      </main>
    );
  }

  const contactDocuments = await prisma.document.findMany({
    where: { linkedType: 'CONTACT', linkedId: contact.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const invoiceDocuments = contact.invoices.length === 0
    ? []
    : await prisma.document.findMany({
        where: {
          linkedType: 'INVOICE',
          linkedId: { in: contact.invoices.map((invoice) => invoice.id) },
        },
        orderBy: { createdAt: 'desc' },
      });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[28px] border border-emerald-500/20 bg-slate-900/75 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Portail client</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Bonjour {contact.fullName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cet espace affiche uniquement les demandes de chanson et le suivi associé à votre dossier.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              <p>{contact.email || session.email}</p>
              <p>{contact.phone || 'Téléphone non renseigné'}</p>
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
                {contactDocuments.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun document visible pour le moment.</p>
                ) : (
                  contactDocuments.map((file) => (
                    <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                      <a href={file.fileUrl} target="_blank" rel="noreferrer" className="block hover:text-emerald-200">
                        <p className="text-sm font-medium text-white">{file.fileName}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(file.createdAt)}</p>
                      </a>
                      <div className="mt-2"><ClientPortalDeleteFileButton token={params.token} fileId={file.id} /></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <ClientFileUploadForm token={params.token} />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Messages</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Communiquer avec Nowis</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="space-y-3">
                {contact.activities.filter((activity) => activity.type === 'MESSAGE').length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun message visible pour le moment.</p>
                ) : (
                  contact.activities.filter((activity) => activity.type === 'MESSAGE').map((activity) => (
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
              actionUrl="/api/client-portal/messages"
              subjectPlaceholder="Objet du message"
              buttonLabel="Envoyer le message"
              extraPayload={{ token: params.token }}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Factures</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Vos factures</h2>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-slate-300">
              {contact.invoices.length} facture{contact.invoices.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {contact.invoices.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune facture visible pour le moment.</p>
            ) : (
              contact.invoices.map((invoice) => (
                <article key={invoice.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Facture {invoice.number}</p>
                      {invoice.description ? <p className="mt-1 text-sm text-slate-300">{invoice.description}</p> : null}
                    </div>
                    <div className="text-sm text-slate-200">
                      <p>{formatCurrency(Number(invoice.amount))}</p>
                      <p className="text-xs text-slate-500">{INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Émise le {formatDate(invoice.issueDate)}</span>
                    <span>Échéance {formatDate(invoice.dueDate)}</span>
                    {invoice.fileUrl ? (
                      <a href={invoice.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">
                        Ouvrir le fichier
                      </a>
                    ) : (
                      <a href={`/crm/client/${params.token}/invoices/${invoice.id}`} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">
                        Ouvrir la version imprimable
                      </a>
                    )}
                  </div>
                  {invoiceDocuments.filter((document) => document.linkedId === invoice.id).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {invoiceDocuments.filter((document) => document.linkedId === invoice.id).map((document) => (
                        <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="block text-xs text-slate-400 hover:text-emerald-200">
                          Justificatif: {document.fileName}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <InvoicePaymentNoticeForm
                    actionUrl={`/api/client-portal/invoices/${invoice.id}/payment?token=${encodeURIComponent(params.token)}`}
                    buttonLabel="Signaler le paiement"
                  />
                </article>
              ))
            )}
          </div>
        </section>

        {contact.songRequests.map((request) => (
          <section key={request.id} className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/15">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Dossier {request.id.slice(0, 8)}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{request.songType}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {request.occasion} pour {request.recipientName}
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200">
                {STATUS_LABELS[request.status] ?? request.status}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Résumé</p>
                <dl className="mt-3 space-y-2 text-sm text-slate-200">
                  <div><dt className="text-slate-500">Créé le</dt><dd>{formatDate(request.createdAt)}</dd></div>
                  <div><dt className="text-slate-500">Style</dt><dd>{request.style}</dd></div>
                  <div><dt className="text-slate-500">Ambiance</dt><dd>{request.mood}</dd></div>
                  <div><dt className="text-slate-500">Budget</dt><dd>{formatCurrency(request.budget === null ? null : Number(request.budget))}</dd></div>
                  <div><dt className="text-slate-500">Date souhaitée</dt><dd>{formatDate(request.desiredDeadline)}</dd></div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Votre message</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{request.details}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Suivi du dossier</p>
                <div className="mt-4 space-y-3">
                  {request.activities.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucune activité visible pour le moment.</p>
                  ) : (
                    request.activities.map((activity) => (
                      <article key={activity.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        {activity.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{activity.description}</p> : null}
                        <p className="mt-2 text-xs text-slate-500">{formatDateTime(activity.createdAt)}</p>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Prochaines étapes</p>
                  <div className="mt-4 space-y-3">
                    {request.tasks.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucune tâche visible pour le moment.</p>
                    ) : (
                      request.tasks.map((task) => (
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

                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-200">Rendez-vous</p>
                    <p className="mt-2 text-sm text-emerald-100">
                      Pour planifier un échange, utilisez uniquement les plages horaires libres du calendrier.
                    </p>
                    <a
                      href={BOOKING_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300"
                    >
                      Prendre rendez-vous
                    </a>
                  </div>
                  <ClientFileUploadForm token={params.token} songRequestId={request.id} />
                  <PortalMessageForm
                    actionUrl="/api/client-portal/messages"
                    subjectPlaceholder="Question sur cette demande"
                    buttonLabel="Envoyer sur la demande"
                    extraPayload={{ token: params.token, songRequestId: request.id }}
                  />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}