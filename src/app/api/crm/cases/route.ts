import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { caseInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { sendCaseCreatedEmail } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'cases', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const items = await prisma.caseRecord.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { contact: { fullName: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    include: {
      contact: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'cases', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = caseInputSchema.parse(await request.json());
    const item = await prisma.caseRecord.create({
      data: {
        title: payload.title.trim(),
        type: payload.type,
        status: payload.status,
        referenceCode: payload.referenceCode.trim(),
        description: normalizeOptionalString(payload.description),
        contactId: normalizeOptionalString(payload.contactId),
        ownerUserId: guard.session.sub,
      },
      include: {
        contact: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Envoyer email si un contact est lié
    if (item.contact?.email) {
      await sendCaseCreatedEmail(item.title, item.contact.email, item.referenceCode);
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
