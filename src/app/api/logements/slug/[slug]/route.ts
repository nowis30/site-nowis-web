import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { getListingBySlug, upsertListing, deleteListing } from '@/lib/db';

function ensureAuth(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? undefined;
  const token = getTokenFromCookie(cookie);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const listing = await getListingBySlug(params.slug);
  if (!listing) {
    return NextResponse.json({ error: 'Logement introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ listing });
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  const user = ensureAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const listing = await getListingBySlug(params.slug);
  if (!listing) {
    return NextResponse.json({ error: 'Logement introuvable.' }, { status: 404 });
  }

  if (listing.ownerId !== user.sub) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const updated: typeof listing = {
    ...listing,
    title: typeof body.title === 'string' ? body.title : listing.title,
    price: typeof body.price === 'number' ? body.price : listing.price,
    city: typeof body.city === 'string' ? body.city : listing.city,
    sector: typeof body.sector === 'string' ? body.sector : listing.sector,
    bedrooms: typeof body.bedrooms === 'number' ? body.bedrooms : listing.bedrooms,
    bathrooms: typeof body.bathrooms === 'number' ? body.bathrooms : listing.bathrooms,
    area: typeof body.area === 'number' ? body.area : listing.area,
    descriptionShort:
      typeof body.descriptionShort === 'string' ? body.descriptionShort : listing.descriptionShort,
    descriptionLong:
      typeof body.descriptionLong === 'string' ? body.descriptionLong : listing.descriptionLong,
    propertyType:
      typeof body.propertyType === 'string' ? body.propertyType : listing.propertyType,
    availabilityDate:
      typeof body.availabilityDate === 'string' ? body.availabilityDate : listing.availabilityDate,
    bookingUrl: typeof body.bookingUrl === 'string' ? body.bookingUrl : listing.bookingUrl,
    heating: typeof body.heating === 'string' ? body.heating : listing.heating,
    parking: typeof body.parking === 'boolean' ? body.parking : listing.parking,
    petsAllowed: typeof body.petsAllowed === 'boolean' ? body.petsAllowed : listing.petsAllowed,
    smokingAllowed: typeof body.smokingAllowed === 'boolean' ? body.smokingAllowed : listing.smokingAllowed,
    furnished: typeof body.furnished === 'boolean' ? body.furnished : listing.furnished,
    images: Array.isArray(body.images)
      ? (body.images as unknown[]).filter((i) => typeof i === 'string') as string[]
      : listing.images,
    status:
      typeof body.status === 'string' && ['draft', 'pending', 'approved', 'rejected'].includes(body.status)
        ? body.status
        : listing.status,
    updatedAt: now,
  };

  await upsertListing(updated);
  return NextResponse.json({ listing: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = ensureAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const listing = await getListingBySlug(params.slug);
    if (!listing) {
      return NextResponse.json({ error: 'Logement introuvable.' }, { status: 404 });
    }

    if (listing.ownerId !== user.sub) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    await deleteListing(listing.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE logement error', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du logement.' }, { status: 500 });
  }
}
