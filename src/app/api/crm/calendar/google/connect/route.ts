import { NextRequest } from 'next/server';
import { handleCalendarConnect } from '@/lib/calendar/oauth-routes';

export async function GET(request: NextRequest) {
  return handleCalendarConnect(request, 'GOOGLE');
}