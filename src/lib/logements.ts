import type { Listing } from '@/types';
import { getAllListings, getListingBySlug } from '@/lib/db';

function isPublished(listing: Listing) {
  return listing.status === 'approved';
}

function sortListings(listings: Listing[]) {
  return [...listings].sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return left.featured ? -1 : 1;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export async function getPublishedListings(): Promise<Listing[]> {
  const listings = await getAllListings();
  return sortListings(listings.filter(isPublished));
}

export async function getPublishedListingBySlug(slug: string): Promise<Listing | undefined> {
  const listing = await getListingBySlug(slug);
  if (!listing || !isPublished(listing)) {
    return undefined;
  }

  return listing;
}
