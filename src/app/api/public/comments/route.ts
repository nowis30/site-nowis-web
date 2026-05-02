import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_MESSAGE_LENGTH = 1200;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 190;
const MAX_SOURCE_PAGE_LENGTH = 120;
const DEFAULT_LIMIT = 6;

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

function normalizeText(input: string, maxLength: number): string {
  return stripTags(input).replace(/\s+/g, ' ').slice(0, maxLength).trim();
}

function normalizeMessage(input: string): string {
  return stripTags(input)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, MAX_MESSAGE_LENGTH)
    .trim();
}

function hashValue(value: string | null): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get('limit');
  const parsedLimit = rawLimit ? Number(rawLimit) : DEFAULT_LIMIT;
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(6, Math.trunc(parsedLimit)))
    : DEFAULT_LIMIT;

  const comments = await prisma.publicComment.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ approvedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      displayName: true,
      message: true,
      rating: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    displayName?: unknown;
    email?: unknown;
    message?: unknown;
    rating?: unknown;
    sourcePage?: unknown;
    consent?: unknown;
    website?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  // Honeypot: si rempli, on répond OK sans persister pour limiter le spam.
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return NextResponse.json({
      success: true,
      message: 'Merci, votre commentaire sera affiché après approbation.',
    });
  }

  const displayName = typeof body.displayName === 'string'
    ? normalizeText(body.displayName, MAX_NAME_LENGTH)
    : '';
  const email = typeof body.email === 'string'
    ? normalizeText(body.email.toLowerCase(), MAX_EMAIL_LENGTH)
    : '';
  const message = typeof body.message === 'string'
    ? normalizeMessage(body.message)
    : '';
  const sourcePage = typeof body.sourcePage === 'string'
    ? normalizeText(body.sourcePage, MAX_SOURCE_PAGE_LENGTH) || '/'
    : '/';

  const parsedRating = typeof body.rating === 'number' ? body.rating : Number(body.rating ?? NaN);
  const hasRating = Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5;
  const consent = body.consent === true;

  if (!consent) {
    return NextResponse.json({ error: 'Le consentement est requis.' }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: 'Le nom affiché est requis.' }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: 'Le commentaire est trop court.' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Le commentaire est trop long.' }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: 'Le courriel est invalide.' }, { status: 400 });
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() || null : null;
  const userAgent = request.headers.get('user-agent');

  await prisma.publicComment.create({
    data: {
      displayName,
      email: email || null,
      message,
      rating: hasRating ? Math.trunc(parsedRating) : null,
      status: 'PENDING',
      sourcePage,
      ipHash: hashValue(ip),
      userAgentHash: hashValue(userAgent),
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Merci, votre commentaire sera affiché après approbation.',
  }, { status: 201 });
}
