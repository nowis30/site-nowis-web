import type { Listing } from '@/types';
import { getAllListings } from './db';

export async function getPublishedListings(): Promise<Listing[]> {
  const listings = await getAllListings();
  return listings
    .filter((listing) => listing.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPublishedListingBySlug(slug: string): Promise<Listing | undefined> {
  const listings = await getAllListings();
  return listings.find((listing) => listing.slug === slug && listing.status === 'approved');
}

export async function getAllCities(): Promise<string[]> {
  const listings = await getAllListings();
  const cities = Array.from(new Set(listings.map((l) => l.city).filter(Boolean)));
  return cities.sort();
}
