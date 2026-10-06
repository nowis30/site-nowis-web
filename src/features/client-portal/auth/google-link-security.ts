import type { ClientPortalSessionPayload } from './session';

/** Email ownership alone must not adopt a password account created by someone else. */
export function canLinkExistingGoogleUser(
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    contact: { id: string; email: string | null; deletedAt?: Date | null } | null;
  },
  session: ClientPortalSessionPayload | null,
): boolean {
  return Boolean(user.id && user.role === 'PORTAL_USER' && user.isActive &&
    user.contact && !user.contact.deletedAt && session &&
    session.scope === 'client-dashboard' && session.role === 'CLIENT' &&
    session.contactId === user.contact.id &&
    session.email.trim().toLowerCase() === user.email.trim().toLowerCase() &&
    session.email.trim().toLowerCase() === user.contact.email?.trim().toLowerCase());
}
