import { Prisma, TaskPriority } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TaskType, coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';

type DbClient = Prisma.TransactionClient | typeof prisma;

export type EnsureCrmTaskInput = {
  title: string;
  description?: string | null;
  type: TaskType | string;
  payload?: unknown;
  priority?: TaskPriority;
  dueDate?: Date | string | null;
  linkedType?: Prisma.TaskUncheckedCreateInput['linkedType'];
  linkedId?: string | null;
  createdById?: string | null;
  songRequestId?: string | null;
  organizationId?: string | null;
  workshopRequestId?: string | null;
  commercialQuoteId?: string | null;
  invoiceId?: string | null;
  appointmentId?: string | null;
  contactId?: string | null;
  isAutoCreated?: boolean;
};

function normalizeOptional(value?: string | null) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toCreateData(input: EnsureCrmTaskInput): Prisma.TaskUncheckedCreateInput {
  const linkedType = input.linkedType ?? (input.contactId ? 'CONTACT' : undefined);
  const linkedId = input.linkedId ?? input.contactId ?? null;

  return {
    title: input.title.trim(),
    description: normalizeOptional(input.description),
    type: coerceTaskType(input.type),
    payload: coerceTaskPayload(input.payload) ?? undefined,
    status: 'TODO',
    priority: input.priority ?? 'MEDIUM',
    dueDate: normalizeDate(input.dueDate),
    linkedType,
    linkedId,
    createdById: input.createdById ?? null,
    songRequestId: input.songRequestId ?? null,
    organizationId: input.organizationId ?? null,
    workshopRequestId: input.workshopRequestId ?? null,
    commercialQuoteId: input.commercialQuoteId ?? null,
    invoiceId: input.invoiceId ?? null,
    appointmentId: input.appointmentId ?? null,
    isAutoCreated: input.isAutoCreated ?? true,
  };
}

export async function ensureCrmTask(input: EnsureCrmTaskInput, db: DbClient = prisma) {
  const type = coerceTaskType(input.type);
  const linkedType = input.linkedType ?? (input.contactId ? 'CONTACT' : undefined);
  const linkedId = input.linkedId ?? input.contactId ?? null;
  const orClauses: Prisma.TaskWhereInput[] = [];

  if (input.contactId) {
    orClauses.push({ linkedType: 'CONTACT', linkedId: input.contactId });
  }
  if (linkedType && linkedId) {
    orClauses.push({ linkedType, linkedId });
  }

  const existing = await db.task.findFirst({
    where: {
      type,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      ...(input.songRequestId ? { songRequestId: input.songRequestId } : {}),
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.workshopRequestId ? { workshopRequestId: input.workshopRequestId } : {}),
      ...(input.commercialQuoteId ? { commercialQuoteId: input.commercialQuoteId } : {}),
      ...(input.invoiceId ? { invoiceId: input.invoiceId } : {}),
      ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
      ...(orClauses.length > 1 ? { OR: orClauses } : {}),
      ...(orClauses.length === 1 ? orClauses[0] : {}),
    },
    select: { id: true },
  });

  if (existing) {
    return {
      taskId: existing.id,
      created: false,
    };
  }

  const created = await db.task.create({
    data: toCreateData(input),
    select: { id: true },
  });

  return {
    taskId: created.id,
    created: true,
  };
}

export async function completeCrmTask(params: { id: string }, db: DbClient = prisma) {
  return db.task.update({
    where: { id: params.id },
    data: {
      status: 'DONE',
      completedAt: new Date(),
    },
  });
}

export async function cancelCrmTask(params: { id: string }, db: DbClient = prisma) {
  return db.task.update({
    where: { id: params.id },
    data: {
      status: 'CANCELLED',
      completedAt: null,
    },
  });
}
