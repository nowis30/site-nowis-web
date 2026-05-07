import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { TasksPage } from '@/features/crm/components/tasks/TasksPage';
import { coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';

export default async function CrmTasksPage() {
  await requireCrmSession();

  const [todo, inProgress, done, cancelled] = await Promise.all([
    prisma.task.findMany({
      where: { status: 'TODO' },
      include: {
        caseRecord: { select: { title: true, referenceCode: true } },
        songRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        workshopRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        commercialQuote: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        invoice: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.task.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        caseRecord: { select: { title: true, referenceCode: true } },
        songRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        workshopRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        commercialQuote: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        invoice: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    }),
    prisma.task.findMany({
      where: { status: 'DONE' },
      include: {
        caseRecord: { select: { title: true, referenceCode: true } },
        songRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        workshopRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        commercialQuote: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        invoice: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.task.findMany({
      where: { status: 'CANCELLED' },
      include: {
        caseRecord: { select: { title: true, referenceCode: true } },
        songRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        workshopRequest: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        commercialQuote: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
        invoice: { select: { id: true, contact: { select: { id: true, fullName: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
  ]);

  function mapTask(item: (typeof todo)[number]) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      type: coerceTaskType(item.type),
      payload: coerceTaskPayload(item.payload),
      status: item.status as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
      priority: item.priority as 'LOW' | 'MEDIUM' | 'HIGH',
      dueDate: item.dueDate?.toISOString() ?? null,
      linkedType: item.linkedType,
      linkedId: item.linkedId,
      isAutoCreated: item.isAutoCreated,
      songRequestId: item.songRequestId,
      workshopRequestId: item.workshopRequestId,
      commercialQuoteId: item.commercialQuoteId,
      invoiceId: item.invoiceId,
      appointmentId: item.appointmentId,
      clientName:
        item.songRequest?.contact?.fullName
        ?? item.workshopRequest?.contact?.fullName
        ?? item.commercialQuote?.contact?.fullName
        ?? item.invoice?.contact?.fullName
        ?? null,
      caseRecord: item.caseRecord,
    };
  }
  return (
    <TasksPage
      todo={todo.map(mapTask)}
      inProgress={inProgress.map(mapTask)}
      done={done.map(mapTask)}
      cancelled={cancelled.map(mapTask)}
    />
  );
}
