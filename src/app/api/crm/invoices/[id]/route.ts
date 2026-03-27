import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { invoiceInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const item = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { contact: true },
  });
  if (!item) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = invoiceInputSchema.parse(await request.json());
    const item = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        number: payload.number.trim(),
        contactId: payload.contactId,
        issueDate: payload.issueDate ? new Date(payload.issueDate) : undefined,
        dueDate: new Date(payload.dueDate),
        amount: payload.amount,
        status: payload.status,
        description: normalizeOptionalString(payload.description),
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'delete');
  if (guard.error) return guard.error;

  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
