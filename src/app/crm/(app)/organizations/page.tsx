import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CrmOrgsAlphaList } from '@/features/crm/components/organizations/CrmOrgsAlphaList';

export default async function OrganizationsPage() {
  await requireCrmSession();

  const orgs = await prisma.organization.findMany({
    where: { crmStatus: { not: 'DELETED' } },
    select: {
      id: true,
      name: true,
      type: true,
      city: true,
      email: true,
      phone: true,
      crmStatus: true,
      contacts: {
        take: 1,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { fullName: true },
      },
      _count: { select: { contacts: true } },
    },
  }).catch(() => []);

  const items = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type ?? null,
    city: o.city ?? null,
    email: o.email ?? null,
    phone: o.phone ?? null,
    primaryContactName: o.contacts[0]?.fullName ?? null,
    contactCount: o._count.contacts,
    crmStatus: o.crmStatus,
  }));

  return <CrmOrgsAlphaList items={items} />;
}
