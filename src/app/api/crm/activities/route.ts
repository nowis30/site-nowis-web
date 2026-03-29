import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { activityInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { z } from 'zod';

const activityTypeFilterSchema = z.enum(['NOTE', 'CALL', 'MESSAGE', 'EMAIL', 'APPOINTMENT', 'INVOICE', 'PAYMENT', 'FORM', 'FORM_SUBMISSION', 'FILE', 'TASK']);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'activities', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const contactId = request.nextUrl.searchParams.get('contactId');
  const type = request.nextUrl.searchParams.get('type');
  const parsedType = type ? activityTypeFilterSchema.safeParse(type) : null;

  const items = await prisma.activity.findMany({
    where: {
      ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(contactId ? { contactId } : {}),
      ...(parsedType?.success ? { type: parsedType.data } : {}),
    },
    include: { contact: { select: { fullName: true } }, user: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'activities', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = activityInputSchema.parse(await request.json());
    const item = await prisma.activity.create({
      data: {
        type: payload.type,
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        contactId: payload.contactId || null,
        propertyId: null,
        userId: guard.session.sub,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
