import { redirect } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { listCalendarConnections } from '@/lib/calendar/service';
import { CalendarConnectionsAdminPage } from '@/features/crm/components/calendar/CalendarConnectionsAdminPage';

export default async function CalendarConnectionsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await requireCrmSession();
  if (session.role !== 'ADMIN') {
    redirect('/crm/dashboard');
  }

  const items = await listCalendarConnections();
  const getValue = (key: string) => {
    const value = searchParams?.[key];
    return typeof value === 'string' ? value : null;
  };

  return (
    <CalendarConnectionsAdminPage
      initialConnections={items}
      initialStatus={getValue('status')}
      initialProvider={getValue('provider')}
      initialError={getValue('error')}
    />
  );
}