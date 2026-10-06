import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { CLIENT_PORTAL_COOKIE_NAME, verifyClientPortalSession } from '@/features/client-portal/auth/session';
import { CRM_COOKIE_NAME, verifyCrmToken } from '@/features/crm/auth/session';

function cookieValue(header: string, name: string) {
  const value = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return value?.slice(name.length + 1);
}

/** Only signed sessions plus persisted active identities can select an account counter. */
export async function getAssistantIdentity(request: Request): Promise<string | null> {
  const cookies = request.headers.get('cookie') || '';
  const portalToken = cookieValue(cookies, CLIENT_PORTAL_COOKIE_NAME);
  const portal = portalToken ? verifyClientPortalSession(portalToken) : null;
  if (portal && z.string().uuid().safeParse(portal.contactId).success && typeof portal.email === 'string') {
    const user = await prisma.user.findFirst({
      where: { contactId: portal.contactId, email: portal.email, role: 'PORTAL_USER', isActive: true,
        contact: { deletedAt: null } }, select: { id: true, contactId: true },
    });
    if (user) return `contact:${user.contactId}`;
    // Existing magic-link client accounts may have a Contact without a password User.
    const contact = await prisma.contact.findFirst({
      where: { id: portal.contactId, email: portal.email, deletedAt: null },
      select: { id: true, userAccount: { select: { isActive: true } } },
    });
    if (contact && (!contact.userAccount || contact.userAccount.isActive)) return `contact:${contact.id}`;
  }

  const crmToken = cookieValue(cookies, CRM_COOKIE_NAME);
  const crm = crmToken ? verifyCrmToken(crmToken) : null;
  if (crm && z.string().uuid().safeParse(crm.sub).success) {
    const user = await prisma.user.findFirst({
      where: { id: crm.sub, email: crm.email, role: crm.role, isActive: true },
      select: { id: true, contactId: true, contact: { select: { deletedAt: true } } },
    });
    if (user && !user.contact?.deletedAt) return user.contactId ? `contact:${user.contactId}` : `user:${user.id}`;
  }

  const legacyToken = cookieValue(cookies, 'nowis_session');
  const legacy = legacyToken ? verifyToken(legacyToken) : null;
  if (legacy) {
    const user = await getUserById(legacy.sub);
    if (user && user.email === legacy.email && user.role === legacy.role) return `legacy-user:${user.id}`;
  }
  return null;
}
