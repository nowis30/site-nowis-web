import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { WorkshopAvailabilityManager } from '@/features/crm/components/settings/WorkshopAvailabilityManager';

export default async function SettingsPage() {
  await requireCrmSession();

  let items = [] as Array<{ id: string; weekday: number; startTime: string; endTime: string; isActive: boolean; capacity: number | null }>;
  try {
    items = await prisma.workshopAvailability.findMany({ orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  return <WorkshopAvailabilityManager initialItems={items} />;
}
