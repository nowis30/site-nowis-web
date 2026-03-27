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

export default async function MaintenanceDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.maintenanceTicket.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { id: true, name: true, code: true } },
      unit: { select: { id: true, unitNumber: true } },
      tenant: { select: { id: true, contact: { select: { id: true, fullName: true, email: true, phone: true } } } },
    },
  });

  if (!item) notFound();

  return (
    <CrmDetailCard
      title={item.title}
      backHref="/crm/maintenance"
      backLabel="Maintenance"
      badge={
        <div className="flex gap-2">
          <StatusBadge value={item.priority} />
          <StatusBadge value={item.status} />
        </div>
      }
      sections={[
        {
          title: 'Ticket',
          fields: [
            { label: 'Titre', value: item.title },
            { label: 'Priorité', value: <StatusBadge value={item.priority} /> },
            { label: 'Statut', value: <StatusBadge value={item.status} /> },
            { label: 'Signalé le', value: formatDate(item.reportedAt) },
            { label: 'Résolu le', value: formatDate(item.resolvedAt) },
          ],
        },
        {
          title: 'Localisation',
          fields: [
            { label: 'Immeuble', value: (
              <a href={`/crm/properties/${item.property.id}`} className="hover:text-primary-300">
                {item.property.name} ({item.property.code})
              </a>
            ) },
            { label: 'Unité', value: item.unit ? (
              <a href={`/crm/units/${item.unit.id}`} className="hover:text-primary-300">
                {item.unit.unitNumber}
              </a>
            ) : null },
          ],
        },
        ...(item.tenant
          ? [{
              title: 'Locataire concerné',
              fields: [
                { label: 'Nom', value: (
                  <a href={`/crm/tenants/${item.tenant.id}`} className="hover:text-primary-300">
                    {item.tenant.contact.fullName}
                  </a>
                ) },
                { label: 'Email', value: item.tenant.contact.email },
                { label: 'Téléphone', value: item.tenant.contact.phone },
              ],
            }]
          : []),
        ...(item.description
          ? [{ title: 'Description', fields: [{ label: '', value: <span className="whitespace-pre-wrap">{item.description}</span> }] }]
          : []),
      ]}
    />
  );
}
