import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { invoiceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { z } from 'zod';

const invoiceStatusFilterSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status');
  const parsedStatus = status ? invoiceStatusFilterSchema.safeParse(status) : null;

  const items = await prisma.invoice.findMany({
    where: {
      ...(q ? { OR: [{ number: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {}),
    },
    include: { contact: { select: { fullName: true, email: true } } },
    orderBy: { issueDate: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = invoiceInputSchema.parse(await request.json());
    const item = await prisma.invoice.create({
      data: {
        number: payload.number.trim(),
        contactId: payload.contactId,
        issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
        dueDate: new Date(payload.dueDate),
        amount: payload.amount,
        status: payload.status,
        description: normalizeOptionalString(payload.description),
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
