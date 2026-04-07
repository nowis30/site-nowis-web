import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      rating: true,
      comment: true,
      context: true,
      createdAt: true,
    },
  });

  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, rating, comment, context } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 });
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
    return NextResponse.json({ error: 'Le commentaire est trop court.' }, { status: 400 });
  }

  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json({ error: 'La note doit être entre 1 et 5.' }, { status: 400 });
  }

  const normalizedEmail =
    typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null;

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

  return NextResponse.json({ success: true }, { status: 201 });
}
