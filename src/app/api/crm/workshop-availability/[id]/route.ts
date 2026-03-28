import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopAvailabilityInputSchema } from '@/features/workshops/schemas';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'settings', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = workshopAvailabilityInputSchema.parse(await request.json());
    const item = await prisma.workshopAvailability.update({ where: { id: params.id }, data: payload });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Les disponibilités atelier ne sont pas encore disponibles sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'settings', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.workshopAvailability.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Les disponibilités atelier ne sont pas encore disponibles sur cette base de données.' }, { status: 503 });
    }

    throw error;
  }
}
