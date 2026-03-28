import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { organizationInputSchema } from '@/features/workshops/schemas';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'organizations', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = organizationInputSchema.parse(await request.json());
    const item = await prisma.organization.update({
      where: { id: params.id },
      data: {
        name: payload.name,
        type: payload.type,
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        address: normalizeOptionalString(payload.address),
        city: normalizeOptionalString(payload.city),
        notes: normalizeOptionalString(payload.notes),
        status: payload.status,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module organisations n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'organizations', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.organization.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module organisations n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    throw error;
  }
}
