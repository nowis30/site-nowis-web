import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { WorkshopAvailabilityManager } from '@/features/crm/components/settings/WorkshopAvailabilityManager';
import { BillingProfileManager } from '@/features/crm/components/settings/BillingProfileManager';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';

export default async function SettingsPage() {
  await requireCrmSession();

  const billingProfile = await getBillingIssuerSnapshot();

  let items = [] as Array<{ id: string; weekday: number; startTime: string; endTime: string; isActive: boolean; capacity: number | null }>;
  try {
    items = await prisma.workshopAvailability.findMany({ orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  return (
    <section className="space-y-6">
      <BillingProfileManager
        initialProfile={{
          displayName: billingProfile.displayName || '',
          companyName: billingProfile.companyName || '',
          legalLabel: billingProfile.legalLabel || '',
          tradeName: billingProfile.tradeName || '',
          email: billingProfile.email || '',
          phone: billingProfile.phone || '',
          website: billingProfile.website || '',
          addressLine1: billingProfile.addressLine1 || '',
          addressLine2: billingProfile.addressLine2 || '',
          city: billingProfile.city || '',
          state: billingProfile.state || '',
          postalCode: billingProfile.postalCode || '',
          country: billingProfile.country || 'Canada',
          taxId: billingProfile.taxId || '',
          paymentTerms: billingProfile.paymentTerms || '',
          footerNote: billingProfile.footerNote || '',
          taxesEnabled: billingProfile.taxesEnabled,
          taxRateGst: String(billingProfile.taxRateGst ?? 0.05),
          taxRateQst: String(billingProfile.taxRateQst ?? 0.09975),
          currency: billingProfile.currency || 'CAD',
        }}
      />

      <WorkshopAvailabilityManager initialItems={items} />
    </section>
  );
}
