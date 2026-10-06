import type { Listing, ListingStatus, User } from '@/types';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function getListingUser(cookie: string | null): Promise<User | null> {
  const token = getTokenFromCookie(cookie || undefined);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return null;
  // Use the current persisted identity and role; deleted users and stale roles cannot mutate listings.
  return (await getUserById(payload.sub)) || null;
}

export function canManageListing(user: User | null, listing: Listing) {
  return Boolean(user && (user.role === 'admin' || user.id === listing.ownerId));
}

export function resolveListingStatus(requested: unknown, user: User): ListingStatus {
  if (user.role === 'admin' && typeof requested === 'string' && ['draft', 'pending', 'approved', 'rejected'].includes(requested)) {
    return requested as ListingStatus;
  }
  // Owner content must pass moderation, including edits to an already published listing.
  return requested === 'draft' ? 'draft' : 'pending';
}
