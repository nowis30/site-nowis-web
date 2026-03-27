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

export default async function UnitDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.unit.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { id: true, name: true, code: true } },
      tenants: {
        where: { isActive: true },
        include: { contact: { select: { id: true, fullName: true, email: true } } },
        take: 1,
      },
      maintenanceTickets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, priority: true, status: true, createdAt: true },
      },
    },
  });

  if (!item) notFound();

  return (
    <CrmDetailCard
      title={`Unité ${item.unitNumber}`}
      backHref="/crm/units"
      backLabel="Logements"
      badge={<StatusBadge value={item.status} />}
      sections={[
        {
          title: 'Informations',
          fields: [
            { label: 'Numéro', value: item.unitNumber },
            { label: 'Immeuble', value: (
              <a href={`/crm/properties/${item.property.id}`} className="hover:text-primary-300">
                {item.property.name} ({item.property.code})
              </a>
            ) },
            { label: 'Étage', value: item.floor },
            { label: 'Chambres', value: item.bedrooms },
            { label: 'Salles de bain', value: item.bathrooms },
            { label: 'Surface (pi²)', value: item.areaSqft },
            { label: 'Loyer mensuel', value: item.monthlyRent ? `${item.monthlyRent} $` : null },
            { label: 'Statut', value: <StatusBadge value={item.status} /> },
            { label: 'Créé le', value: formatDate(item.createdAt) },
          ],
        },
        ...(item.tenants.length > 0
          ? [{
              title: 'Locataire actuel',
              fields: item.tenants.map((t) => ({
                label: '',
                value: (
                  <a href={`/crm/tenants/${t.id}`} className="hover:text-primary-300">
                    {t.contact.fullName} · {t.contact.email ?? '—'}
                  </a>
                ),
              })),
            }]
          : []),
        ...(item.maintenanceTickets.length > 0
          ? [{
              title: 'Maintenance récente',
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
