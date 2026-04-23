import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  const reviews = await prisma.review.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      rating: true,
      comment: true,
      context: true,
      createdAt: true,
    },
  });

  return applyCorsHeaders(NextResponse.json(reviews), request, {
    methods: 'GET, POST, OPTIONS',
    headers: 'Content-Type, Authorization',
    credentials: false,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, rating, comment, context } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return applyCorsHeaders(NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 }), request);
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
    return applyCorsHeaders(NextResponse.json({ error: 'Le commentaire est trop court.' }, { status: 400 }), request);
  }

  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return applyCorsHeaders(NextResponse.json({ error: 'La note doit être entre 1 et 5.' }, { status: 400 }), request);
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return applyCorsHeaders(NextResponse.json({ error: 'L email est requis.' }, { status: 400 }), request);
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return applyCorsHeaders(NextResponse.json({ error: 'Email invalide.' }, { status: 400 }), request);
  }

  await prisma.review.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      rating: parsedRating,
      comment: comment.trim(),
      context: typeof context === 'string' && context.trim().length > 0 ? context.trim() : null,
      status: 'pending',
    },
  });

  return applyCorsHeaders(NextResponse.json({ success: true }, { status: 201 }), request, {
    methods: 'GET, POST, OPTIONS',
    headers: 'Content-Type, Authorization',
    credentials: false,
  });
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, {
    methods: 'GET, POST, OPTIONS',
    headers: 'Content-Type, Authorization',
    credentials: false,
  });
}
