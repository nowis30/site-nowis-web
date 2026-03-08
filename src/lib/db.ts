import fs from 'fs/promises';
import path from 'path';

import type { Listing, User } from '@/types';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export interface Database {
  users: User[];
  listings: Listing[];
}

export async function readDatabase(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Database;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
    };
  } catch (error) {
    // If file is missing or invalid, initialize a clean database.
    const initial: Database = { users: [], listings: [] };
    await writeDatabase(initial);
    return initial;
  }
}

export async function writeDatabase(db: Database): Promise<void> {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export async function upsertUser(user: User): Promise<User> {
  const db = await readDatabase();
  const existingIndex = db.users.findIndex((u) => u.id === user.id);
  if (existingIndex !== -1) {
    db.users[existingIndex] = user;
  } else {
    db.users.push(user);
  }
  await writeDatabase(db);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await readDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const db = await readDatabase();
  return db.users.find((u) => u.id === userId);
}

export async function getAllListings(): Promise<Listing[]> {
  const db = await readDatabase();
  return db.listings;
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const db = await readDatabase();
  return db.listings.find((l) => l.id === id);
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const db = await readDatabase();
  return db.listings.find((l) => l.slug === slug);
}

export async function upsertListing(listing: Listing): Promise<Listing> {
  const db = await readDatabase();
  const existingIndex = db.listings.findIndex((l) => l.id === listing.id);
  if (existingIndex !== -1) {
    db.listings[existingIndex] = listing;
  } else {
    db.listings.push(listing);
  }
  await writeDatabase(db);
  return listing;
}

export async function deleteListing(id: string): Promise<void> {
  const db = await readDatabase();
  db.listings = db.listings.filter((l) => l.id !== id);
  await writeDatabase(db);
}

export async function getListingsByOwner(ownerId: string): Promise<Listing[]> {
  const db = await readDatabase();
  return db.listings.filter((listing) => listing.ownerId === ownerId);
}
