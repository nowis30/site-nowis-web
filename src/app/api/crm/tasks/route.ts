import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { taskInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';
import { z } from 'zod';

const taskStatusFilterSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
const taskPriorityFilterSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const taskTypeFilterSchema = z.enum([
  'CALL',
  'EMAIL',
  'SONG',
  'CALLBACK',
  'CREATE_QUOTE',
  'CREATE_INVOICE',
  'CREATE_SONG',
  'UPLOAD_SONG_FILE',
  'SCHEDULE_WORKSHOP',
  'FOLLOW_UP',
  'DOCUMENT_REVIEW',
  'CUSTOM',
]);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'tasks', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status');
  const priority = request.nextUrl.searchParams.get('priority');
  const type = request.nextUrl.searchParams.get('type');
  const contactId = request.nextUrl.searchParams.get('contactId')?.trim();
  const parsedStatus = status ? taskStatusFilterSchema.safeParse(status) : null;
  const parsedPriority = priority ? taskPriorityFilterSchema.safeParse(priority) : null;
  const parsedType = type ? taskTypeFilterSchema.safeParse(type) : null;

  const items = await prisma.task.findMany({
    where: {
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {}),
      ...(parsedPriority?.success ? { priority: parsedPriority.data } : {}),
      ...(parsedType?.success ? { type: parsedType.data } : {}),
      ...(contactId
        ? {
            OR: [
              { linkedType: 'CONTACT', linkedId: contactId },
              { songRequest: { contactId } },
              { workshopRequest: { contactId } },
              { commercialQuote: { contactId } },
              { invoice: { contactId } },
            ],
          }
        : {}),
    },
    include: {
      caseRecord: { select: { title: true, referenceCode: true } },
      songRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
      workshopRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
      commercialQuote: { select: { id: true, quoteNumber: true, contact: { select: { id: true, fullName: true } } } },
      invoice: { select: { id: true, number: true, contact: { select: { id: true, fullName: true } } } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      type: coerceTaskType(item.type),
      payload: coerceTaskPayload(item.payload),
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'tasks', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = taskInputSchema.parse(await request.json());
    const item = await prisma.task.create({
      data: {
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        type: payload.type,
        payload: payload.payload ?? undefined,
        status: payload.status,
        priority: payload.priority,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        completedAt: payload.status === 'DONE' ? new Date() : null,
        caseId: payload.caseId || null,
        songRequestId: payload.songRequestId || null,
        organizationId: payload.organizationId || null,
        workshopRequestId: payload.workshopRequestId || null,
        commercialQuoteId: payload.commercialQuoteId || null,
        invoiceId: payload.invoiceId || null,
        appointmentId: payload.appointmentId || null,
        createdById: guard.session.sub,
      },
    });
    return NextResponse.json({
      item: {
        ...item,
        type: coerceTaskType(item.type),
        payload: coerceTaskPayload(item.payload),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
}
