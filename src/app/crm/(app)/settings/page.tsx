import { RevokePublicLinkForm } from '@/components/files/RevokePublicLinkForm';
import { SecurityDiagnostics } from '@/components/files/SecurityDiagnostics';
import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { WorkshopAvailabilityManager } from '@/features/crm/components/settings/WorkshopAvailabilityManager';
import { BillingProfileManager } from '@/features/crm/components/settings/BillingProfileManager';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';

export default async function SettingsPage() {
  const session = await requireCrmSession();
  const isAdmin = session.role === 'ADMIN';
  const billingProfile = isAdmin ? await getBillingIssuerSnapshot() : null;

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
      {billingProfile ? (
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
      ) : (
        <p className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
          Le profil de facturation, y compris les numéros de taxes, est réservé à l’administrateur.
        </p>
      )}

      <WorkshopAvailabilityManager initialItems={items} />
      {session.role === 'ADMIN' && <RevokePublicLinkForm />}
      {session.role === 'ADMIN' && <SecurityDiagnostics />}
    </section>
  );
}
