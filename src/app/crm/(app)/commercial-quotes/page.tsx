import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CommercialQuotesListPage } from '@/features/crm/components/commercial-quotes/CommercialQuotesListPage';

export default async function CrmCommercialQuotesPage() {
  await requireCrmSession();

  const items = await prisma.commercialQuote.findMany({
    include: {
      contact: { select: { id: true, fullName: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <CommercialQuotesListPage
      items={items.map((item) => ({
        id: item.id,
        quoteNumber: item.quoteNumber,
        title: item.title,
        status: item.status,
        totalAmount: item.totalAmount.toString(),
        currency: item.currency,
        createdAt: item.createdAt.toISOString(),
        validUntil: item.validUntil?.toISOString() ?? null,
        contact: item.contact ? { id: item.contact.id, fullName: item.contact.fullName } : null,
        organization: item.organization ? { id: item.organization.id, name: item.organization.name } : null,
      }))}
    />
  );
}
