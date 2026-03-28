import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { workshopRequestInputSchema } from '@/features/workshops/schemas';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = workshopRequestInputSchema.parse(await request.json());
    const item = await prisma.workshopRequest.update({
      where: { id: params.id },
      data: {
        organizationId: payload.organizationId,
        contactId: payload.contactId || null,
        organizationContactId: payload.organizationContactId || null,
        title: payload.title,
        audienceType: payload.audienceType,
        ageRange: normalizeOptionalString(payload.ageRange),
        estimatedParticipants: payload.estimatedParticipants ?? null,
        requestedDate: payload.requestedDate ? new Date(payload.requestedDate) : null,
        requestedTime: normalizeOptionalString(payload.requestedTime),
        preferredDays: payload.preferredDays,
        format: payload.format,
        location: normalizeOptionalString(payload.location),
        workshopTheme: payload.workshopTheme,
        objectives: payload.objectives,
        notes: normalizeOptionalString(payload.notes),
        status: payload.status,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.workshopRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    throw error;
  }
}
