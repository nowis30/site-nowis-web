import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CrmDetailCard } from '@/features/crm/components/shared/CrmDetailCard';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';
import { buildTenantPortalUrl, signTenantPortalToken } from '@/lib/client-portal';

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface PageProps {
  params: { id: string };
}

export default async function TenantDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      unit: { select: { id: true, unitNumber: true, property: { select: { id: true, name: true, code: true } } } },
      maintenanceTickets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, priority: true, status: true, createdAt: true },
      },
    },
  });

  if (!item) notFound();

  const tenantPortalToken = signTenantPortalToken({
    tenantId: item.id,
    contactId: item.contact.id,
    email: item.contact.email || '',
    fullName: item.contact.fullName,
  });
  const tenantPortalUrl = buildTenantPortalUrl(tenantPortalToken);

  return (
    <CrmDetailCard
      title={item.contact.fullName}
      backHref="/crm/tenants"
      backLabel="Locataires"
      badge={<StatusBadge value={item.isActive ? 'ACTIVE' : 'CLOSED'} />}
      sections={[
        {
          title: 'Contact',
          fields: [
            { label: 'Nom', value: (
              <a href={`/crm/contacts/${item.contact.id}`} className="hover:text-primary-300">
                {item.contact.fullName}
              </a>
            ) },
            { label: 'Email', value: item.contact.email },
            { label: 'Téléphone', value: item.contact.phone },
            { label: 'Portail locataire', value: (
              <a href={tenantPortalUrl} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200">
                Ouvrir le portail
              </a>
            ) },
          ],
        },
        {
          title: 'Logement',
          fields: [
            { label: 'Unité', value: item.unit ? (
              <a href={`/crm/units/${item.unit.id}`} className="hover:text-primary-300">
                {item.unit.unitNumber}
              </a>
            ) : null },
            { label: 'Immeuble', value: item.unit?.property ? (
              <a href={`/crm/properties/${item.unit.property.id}`} className="hover:text-primary-300">
                {item.unit.property.name} ({item.unit.property.code})
              </a>
            ) : null },
            { label: 'Entrée', value: formatDate(item.moveInDate) },
            { label: 'Sortie', value: formatDate(item.moveOutDate) },
          ],
        },
        {
          title: 'Urgence',
          fields: [
            { label: 'Personne à contacter', value: item.emergencyContact },
            { label: 'Téléphone urgence', value: item.emergencyPhone },
          ],
        },
        ...(item.maintenanceTickets.length > 0
          ? [{
              title: 'Tickets maintenance',
              fields: item.maintenanceTickets.map((m) => ({
                label: formatDate(m.createdAt),
                value: (
                  <a href={`/crm/maintenance/${m.id}`} className="flex items-center gap-2 hover:text-primary-300">
                    {m.title}
                    <StatusBadge value={m.priority} />
                    <StatusBadge value={m.status} />
                  </a>
                ),
              })),
            }]
          : []),
      ]}
    />
  );
}
