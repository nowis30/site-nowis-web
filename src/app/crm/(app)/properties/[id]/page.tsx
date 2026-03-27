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

export default async function PropertyDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      units: { orderBy: { unitNumber: 'asc' }, select: { id: true, unitNumber: true, status: true, bedrooms: true, monthlyRent: true } },
    },
  });

  if (!item) notFound();

  const occupied = item.units.filter((u) => u.status === 'OCCUPIED').length;
  const vacant = item.units.filter((u) => u.status === 'VACANT').length;

  return (
    <CrmDetailCard
      title={`${item.name} (${item.code})`}
      backHref="/crm/properties"
      backLabel="Immeubles"
      badge={<StatusBadge value={item.type} />}
      sections={[
        {
          title: 'Informations',
          fields: [
            { label: 'Code', value: item.code },
            { label: 'Nom', value: item.name },
            { label: 'Type', value: <StatusBadge value={item.type} /> },
            { label: 'Adresse', value: item.addressLine1 },
            { label: 'Complément', value: item.addressLine2 },
            { label: 'Ville', value: item.city },
            { label: 'Province', value: item.province },
            { label: 'Code postal', value: item.postalCode },
            { label: 'Année construction', value: item.yearBuilt },
            { label: 'Total logements', value: item.totalUnits },
            { label: 'Créé le', value: formatDate(item.createdAt) },
          ],
        },
        ...(item.managerName || item.managerPhone
          ? [{
              title: 'Gestionnaire',
              fields: [
                { label: 'Nom', value: item.managerName },
                { label: 'Téléphone', value: item.managerPhone },
              ],
            }]
          : []),
        {
          title: `Logements (${item.units.length}) · ${occupied} occupés · ${vacant} libres`,
          fields: item.units.map((u) => ({
            label: `Unité ${u.unitNumber}`,
            value: (
              <a href={`/crm/units/${u.id}`} className="flex items-center gap-2 hover:text-primary-300">
                {u.bedrooms} ch. · {u.monthlyRent ? `${u.monthlyRent} $` : '—'}
                <StatusBadge value={u.status} />
              </a>
            ),
          })),
        },
      ]}
    />
  );
}
