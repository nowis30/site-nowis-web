import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CalendarCreateAppointmentPage } from '@/features/crm/components/calendar/CalendarCreateAppointmentPage';

export default async function NewCalendarAppointmentPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  await requireCrmSession();

  const date = typeof searchParams?.date === 'string' ? searchParams.date : undefined;

  const [contacts, organizations, workshopRequests, songRequests, calendarConnections] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, email: true },
      take: 500,
    }),
    prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
      take: 500,
    }),
    prisma.workshopRequest.findMany({
      where: { status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
      take: 200,
    }),
    prisma.songRequest.findMany({
      where: { status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, occasion: true },
      take: 200,
    }),
    prisma.calendarConnection.findMany({
      where: {
        status: { in: ['CONNECTED', 'EXPIRED', 'ERROR'] },
        provider: { not: 'CALENDLY' },
      },
      orderBy: [{ provider: 'asc' }, { accountEmail: 'asc' }],
      select: {
        id: true,
        provider: true,
        accountEmail: true,
        accountName: true,
      },
      take: 50,
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') return [];
      throw error;
    }),
  ]);

  return (
    <CalendarCreateAppointmentPage
      initialDate={date}
      contacts={contacts}
      organizations={organizations}
      workshopRequests={workshopRequests.map((item) => ({ id: item.id, label: item.title }))}
      songRequests={songRequests.map((item) => ({ id: item.id, label: item.title || item.occasion || 'Demande chanson' }))}
      calendarConnections={calendarConnections.map((item) => ({
        id: item.id,
        provider: item.provider,
        label: `${item.provider} - ${item.accountEmail || item.accountName || 'Compte connecte'}`,
      }))}
    />
  );
}
