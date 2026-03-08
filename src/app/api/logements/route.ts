import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { Listing } from '@/types';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { getAllListings, upsertListing } from '@/lib/db';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') ?? undefined;
    const token = getTokenFromCookie(cookie);
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Jeton invalide.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      price,
      city,
      sector,
      bedrooms,
      bathrooms,
      area,
      descriptionShort,
      descriptionLong,
      propertyType,
      availabilityDate,
      bookingUrl,
      heating,
      parking,
      petsAllowed,
      smokingAllowed,
      furnished,
      images,
      status,
    } = body as Record<string, unknown>;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const baseSlug = slugify(title);

    const existing = await getAllListings();
    const slugCandidate = [baseSlug, randomUUID().slice(0, 6)]
      .filter(Boolean)
      .join('-');

    const listing: Listing = {
      id: randomUUID(),
      slug: slugCandidate,
      title,
      price: Number(price ?? 0),
      city: String(city ?? ''),
      sector: String(sector ?? ''),
      bedrooms: Number(bedrooms ?? 0),
      bathrooms: Number(bathrooms ?? 0),
      area: Number(area ?? 0),
      descriptionShort: String(descriptionShort ?? ''),
      descriptionLong: String(descriptionLong ?? ''),
      propertyType: typeof propertyType === 'string' ? propertyType : undefined,
      availabilityDate: typeof availabilityDate === 'string' ? availabilityDate : undefined,
      bookingUrl: typeof bookingUrl === 'string' ? bookingUrl : undefined,
      heating: typeof heating === 'string' ? heating : undefined,
      parking:
        parking === 'yes'
          ? true
          : parking === 'no'
          ? false
          : undefined,
      petsAllowed:
        petsAllowed === 'yes'
          ? true
          : petsAllowed === 'no'
          ? false
          : undefined,
      smokingAllowed:
        smokingAllowed === 'yes'
          ? true
          : smokingAllowed === 'no'
          ? false
          : undefined,
      furnished:
        furnished === 'yes'
          ? true
          : furnished === 'no'
          ? false
          : undefined,
      images: Array.isArray(images) ? images.filter((i) => typeof i === 'string') : [],
      status: typeof status === 'string' && ['draft', 'pending', 'approved', 'rejected'].includes(status)
        ? (status as Listing['status'])
        : 'pending',
      ownerId: payload.sub,
      ownerName: payload.name,
      ownerEmail: payload.email,
      ownerPhone: '',
      createdAt: now,
      updatedAt: now,
    };

    await upsertListing(listing);
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('api/logements POST error', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
