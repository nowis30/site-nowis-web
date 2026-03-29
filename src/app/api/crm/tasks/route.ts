import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { taskInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';
import { z } from 'zod';

const taskStatusFilterSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'tasks', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const status = request.nextUrl.searchParams.get('status');
  const parsedStatus = status ? taskStatusFilterSchema.safeParse(status) : null;

  const items = await prisma.task.findMany({
    where: {
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {}),
    },
    include: { caseRecord: { select: { title: true, referenceCode: true } } },
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
        caseId: payload.caseId || null,
        songRequestId: payload.songRequestId || null,
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
