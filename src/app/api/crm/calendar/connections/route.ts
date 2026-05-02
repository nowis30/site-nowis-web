import { NextRequest, NextResponse } from 'next/server';
import { listCalendarConnections } from '@/lib/calendar/service';
import { requireCalendarAdminAccess } from '@/lib/calendar/oauth-routes';

export async function GET(request: NextRequest) {
  const guard = requireCalendarAdminAccess(request, 'read');
  if (guard.error) return guard.error;

  const items = await listCalendarConnections();
  return NextResponse.json({ items });
}