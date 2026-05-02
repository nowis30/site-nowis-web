import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordCalendarActivity, syncCalendarConnections } from '@/lib/calendar/service';
import { requireCalendarAdminAccess } from '@/lib/calendar/oauth-routes';

const syncSchema = z.object({
  connectionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const guard = requireCalendarAdminAccess(request, 'update');
  if (guard.error) return guard.error;

  try {
    const payload = syncSchema.parse(await request.json().catch(() => ({})));
    const results = await syncCalendarConnections(payload.connectionId || null);

    await recordCalendarActivity({
      title: 'Calendrier synchronisé',
      description: payload.connectionId ? `Synchronisation ciblée (${results.length} connexion)` : `Synchronisation globale (${results.length} connexions)`,
      userId: guard.session.sub,
      relatedId: payload.connectionId || null,
    });

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronisation impossible';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}