import Link from 'next/link';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { NotificationStatusButton } from '@/features/crm/components/notifications/NotificationStatusButton';
import { getPortalNotificationHref, getPortalNotificationLabel } from '@/lib/portal-notifications';

interface PageProps {
  searchParams?: {
    status?: string;
  };
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function CrmNotificationsPage({ searchParams }: PageProps) {
  await requireCrmSession();

  const status = searchParams?.status === 'handled' ? 'handled' : searchParams?.status === 'all' ? 'all' : 'open';

  const where = {
    direction: 'INBOUND' as const,
    OR: [
      { channel: 'portal' },
      { channel: { startsWith: 'portal-' } },
    ],
    ...(status === 'open' ? { handledAt: null } : {}),
    ...(status === 'handled' ? { handledAt: { not: null } } : {}),
  };

  const [openCount, handledCount, notifications] = await Promise.all([
    prisma.communication.count({
      where: {
        direction: 'INBOUND',
        OR: [{ channel: 'portal' }, { channel: { startsWith: 'portal-' } }],
        handledAt: null,
      },
    }),
    prisma.communication.count({
      where: {
        direction: 'INBOUND',
        OR: [{ channel: 'portal' }, { channel: { startsWith: 'portal-' } }],
        handledAt: { not: null },
      },
    }),
    prisma.communication.findMany({
      where,
      orderBy: [{ handledAt: 'asc' }, { sentAt: 'desc' }],
      take: 50,
      include: {
        contact: { select: { id: true, fullName: true, email: true } },
        tenant: { select: { id: true } },
        handledBy: { select: { fullName: true } },
      },
    }),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Suivi interne</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Centre de notifications</h2>
          <p className="mt-2 text-sm text-slate-400">Messages entrants, signalements de paiement, tâches et maintenance envoyés depuis les portails.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/crm/notifications" className={`rounded-full border px-4 py-2 transition ${status === 'open' ? 'border-amber-500/60 bg-amber-500/10 text-amber-200' : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
            À traiter ({openCount})
          </Link>
          <Link href="/crm/notifications?status=handled" className={`rounded-full border px-4 py-2 transition ${status === 'handled' ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
            Traitées ({handledCount})
          </Link>
          <Link href="/crm/notifications?status=all" className={`rounded-full border px-4 py-2 transition ${status === 'all' ? 'border-primary-500/60 bg-primary-500/10 text-primary-200' : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
            Tout voir ({openCount + handledCount})
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
          Aucune notification dans cette vue.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const href = getPortalNotificationHref({
              linkedType: notification.linkedType,
              linkedId: notification.linkedId,
              tenantId: notification.tenantId,
              contactId: notification.contactId,
            });

            return (
              <article key={notification.id} className={`rounded-3xl border p-5 shadow-xl shadow-black/10 ${notification.handledAt ? 'border-emerald-900/60 bg-emerald-950/10' : 'border-amber-900/60 bg-slate-900/70'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-3 py-1 font-medium ${notification.handledAt ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>
                        {notification.handledAt ? 'Traitée' : 'À traiter'}
                      </span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                        {getPortalNotificationLabel(notification.channel)}
                      </span>
                      <span className="text-slate-500">{formatDateTime(notification.sentAt)}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">{notification.subject || getPortalNotificationLabel(notification.channel)}</h3>
                      <p className="mt-1 text-sm text-slate-300">{notification.contact?.fullName || 'Contact inconnu'}{notification.contact?.email ? ` • ${notification.contact.email}` : ''}</p>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{notification.body}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <Link href={href} className="text-primary-300 hover:text-primary-200">Ouvrir dans le CRM</Link>
                      {notification.handledAt ? (
                        <span>Traitée le {formatDateTime(notification.handledAt)}{notification.handledBy ? ` par ${notification.handledBy.fullName}` : ''}</span>
                      ) : (
                        <span>En attente de traitement</span>
                      )}
                    </div>
                  </div>

                  <NotificationStatusButton notificationId={notification.id} handled={Boolean(notification.handledAt)} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}