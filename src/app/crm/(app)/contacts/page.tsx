import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CrmContactsAlphaList } from '@/features/crm/components/contacts/CrmContactsAlphaList';

export default async function ContactsPage() {
  await requireCrmSession();

  const contacts = await prisma.contact.findMany({
    where: { crmStatus: { not: 'DELETED' } },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      crmStatus: true,
      createdAt: true,
      organizationLinks: {
        take: 1,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: {
          organization: { select: { name: true } },
        },
      },
    },
  }).catch(() => []);

  const items = contacts.map((c) => ({
    id: c.id,
    fullName: c.fullName ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    organizationName: c.organizationLinks[0]?.organization?.name ?? null,
    crmStatus: c.crmStatus,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CrmContactsAlphaList items={items} />;
}
