import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { appointmentInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'read');
  if (guard.error) return guard.error;

  const item = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { contact: true },
  });
  if (!item) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = appointmentInputSchema.parse(await request.json());
    const item = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        type: payload.type,
        status: payload.status,
        contactId: payload.contactId || null,
        propertyId: null,
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'delete');
  if (guard.error) return guard.error;

  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
