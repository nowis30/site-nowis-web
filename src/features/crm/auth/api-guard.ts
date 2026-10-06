import { NextRequest, NextResponse } from 'next/server';
import { can, CrmAction, CrmModuleKey } from './permissions';
import { getCrmSessionFromCookieHeader } from './session';
import { publicInquiryOriginAllowed } from '@/lib/public-inquiry-security';

export async function getApiSession(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? undefined;
  return getCrmSessionFromCookieHeader(cookie);
}

export function forbid(message = 'Accès non autorisé') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorized(message = 'Session invalide') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireApiPermission(
  request: NextRequest,
  module: CrmModuleKey,
  action: CrmAction,
) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)
    && (!publicInquiryOriginAllowed(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site')) {
    return { error: forbid('Cette demande doit provenir du site Nowis.'), session: null } as const;
  }
  const session = await getApiSession(request);
  if (!session) {
    return { error: unauthorized(), session: null } as const;
  }
  if (!can(session.role, module, action)) {
    return { error: forbid(), session: null } as const;
  }
  return { error: null, session } as const;
}
