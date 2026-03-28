import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopAvailabilityInputSchema } from '@/features/workshops/schemas';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'settings', 'read');
  if (guard.error) return guard.error;

  try {
    const items = await prisma.workshopAvailability.findMany({ orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ items: [], unavailable: true });
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'settings', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = workshopAvailabilityInputSchema.parse(await request.json());
    const item = await prisma.workshopAvailability.create({ data: payload });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Les disponibilités atelier ne sont pas encore disponibles sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
