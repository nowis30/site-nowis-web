import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CrmDetailCard } from '@/features/crm/components/shared/CrmDetailCard';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface PageProps {
  params: { id: string };
}

export default async function CaseDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.caseRecord.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { fullName: true } } } },
      tasks: { select: { id: true, title: true, status: true, priority: true, dueDate: true }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!item) notFound();

  return (
    <CrmDetailCard
      title={item.title}
      backHref="/crm/cases"
      backLabel="Dossiers"
      badge={
        <div className="flex gap-2">
          <StatusBadge value={item.type} />
          <StatusBadge value={item.status} />
        </div>
      }
      sections={[
        {
          title: 'Informations',
          fields: [
            { label: 'Référence', value: item.referenceCode },
            { label: 'Type', value: <StatusBadge value={item.type} /> },
            { label: 'Statut', value: <StatusBadge value={item.status} /> },
            { label: 'Contact', value: item.contact ? (
              <a href={`/crm/contacts/${item.contact.id}`} className="hover:text-primary-300">
                {item.contact.fullName}
              </a>
            ) : null },
            { label: 'Email contact', value: item.contact?.email },
            { label: 'Téléphone contact', value: item.contact?.phone },
            { label: 'Ouvert le', value: formatDate(item.openedAt) },
            { label: 'Fermé le', value: formatDate(item.closedAt) },
          ],
        },
        ...(item.description
          ? [{ title: 'Description', fields: [{ label: '', value: <span className="whitespace-pre-wrap">{item.description}</span> }] }]
          : []),
        ...(item.notes.length > 0
          ? [{
              title: `Notes (${item.notes.length})`,
              fields: item.notes.map((note) => ({
                label: `${note.author?.fullName ?? 'Système'} · ${formatDate(note.createdAt)}`,
                value: <span className="whitespace-pre-wrap">{note.content}</span>,
              })),
            }]
          : []),
        ...(item.tasks.length > 0
          ? [{
              title: 'Tâches',
              fields: item.tasks.map((t) => ({
                label: t.dueDate ? `Échéance : ${formatDate(t.dueDate)}` : '',
                value: (
                  <div className="flex items-center gap-2">
                    {t.title}
                    <StatusBadge value={t.status} />
                    <StatusBadge value={t.priority} />
                  </div>
                ),
              })),
            }]
          : []),
      ]}
    />
  );
}
