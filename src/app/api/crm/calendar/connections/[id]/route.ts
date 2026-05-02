import { NextRequest, NextResponse } from 'next/server';
import { disconnectCalendarConnection, getCalendarConnectionById, recordCalendarActivity } from '@/lib/calendar/service';
import { requireCalendarAdminAccess } from '@/lib/calendar/oauth-routes';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireCalendarAdminAccess(request, 'update');
  if (guard.error) return guard.error;

  const existing = await getCalendarConnectionById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Connexion calendrier introuvable' }, { status: 404 });
  }

  const item = await disconnectCalendarConnection(params.id);
  await recordCalendarActivity({
    title: `${existing.provider} déconnecté`,
    description: existing.accountEmail || existing.accountName || existing.providerAccountId,
    userId: guard.session.sub,
    relatedId: params.id,
  });

  return NextResponse.json({ item });
}