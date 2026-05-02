import { NextRequest } from 'next/server';
import { handleCalendarCallback } from '@/lib/calendar/oauth-routes';

export async function GET(request: NextRequest) {
  return handleCalendarCallback(request, 'GOOGLE');
}