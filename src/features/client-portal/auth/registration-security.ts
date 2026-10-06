import type { ClientPortalSessionPayload } from './session';

export function hasVerifiedContactRegistration(
  contact: { id: string; email: string | null; deletedAt?: Date | null },
  session: ClientPortalSessionPayload | null,
) {
  return Boolean(!contact.deletedAt && session && session.contactId === contact.id &&
    session.email.trim().toLowerCase() === contact.email?.trim().toLowerCase());
}
