import assert from 'node:assert/strict';
import test from 'node:test';
import { cancelCrmTask, completeCrmTask, ensureCrmTask } from '@/features/crm/server/task-automation';

type MockTask = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: Date | null;
  completedAt: Date | null;
  linkedType: string | null;
  linkedId: string | null;
  songRequestId: string | null;
  organizationId: string | null;
  workshopRequestId: string | null;
  commercialQuoteId: string | null;
  invoiceId: string | null;
  appointmentId: string | null;
  isAutoCreated: boolean;
};

function matchesWhere(task: MockTask, where: any): boolean {
  if (!where) return true;

  if (where.OR) {
    return where.OR.some((sub: any) => matchesWhere(task, sub));
  }

  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR') continue;
    if (key === 'status' && value && typeof value === 'object' && 'in' in value) {
      if (!(value as any).in.includes(task.status)) return false;
      continue;
    }

    if ((task as any)[key] !== value) {
      return false;
    }
  }

  return true;
}

function createMockDb() {
  const tasks: MockTask[] = [];

  return {
    tasks,
    task: {
      findFirst: async (args: any) => {
        const found = tasks.find((item) => matchesWhere(item, args?.where));
        if (!found) return null;
        return args?.select?.id ? { id: found.id } : found;
      },
      create: async (args: any) => {
        const data = args.data;
        const created: MockTask = {
          id: `task-${tasks.length + 1}`,
          title: data.title,
          description: data.description ?? null,
          type: data.type,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ?? null,
          completedAt: data.completedAt ?? null,
          linkedType: data.linkedType ?? null,
          linkedId: data.linkedId ?? null,
          songRequestId: data.songRequestId ?? null,
          organizationId: data.organizationId ?? null,
          workshopRequestId: data.workshopRequestId ?? null,
          commercialQuoteId: data.commercialQuoteId ?? null,
          invoiceId: data.invoiceId ?? null,
          appointmentId: data.appointmentId ?? null,
          isAutoCreated: Boolean(data.isAutoCreated),
        };
        tasks.push(created);
        return args?.select?.id ? { id: created.id } : created;
      },
      update: async (args: any) => {
        const idx = tasks.findIndex((item) => item.id === args.where.id);
        if (idx < 0) throw new Error('Task not found');
        tasks[idx] = { ...tasks[idx], ...args.data };
        return tasks[idx];
      },
    },
  };
}

test('A. ensureCrmTask dedupe la meme tache ouverte', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'CREATE_QUOTE',
    title: 'Préparer la soumission pour la chanson',
    contactId: 'contact-a',
    songRequestId: 'song-a',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-a',
    isAutoCreated: true,
  }, db);

  await ensureCrmTask({
    type: 'CREATE_QUOTE',
    title: 'Préparer la soumission pour la chanson',
    contactId: 'contact-a',
    songRequestId: 'song-a',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-a',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.length, 1);
});

test('B. inscription client -> CALLBACK unique', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'CALLBACK',
    title: 'Rappeler le nouveau client',
    contactId: 'contact-register',
    linkedType: 'CONTACT',
    linkedId: 'contact-register',
    isAutoCreated: true,
  }, db);
  await ensureCrmTask({
    type: 'CALLBACK',
    title: 'Rappeler le nouveau client',
    contactId: 'contact-register',
    linkedType: 'CONTACT',
    linkedId: 'contact-register',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.filter((t: MockTask) => t.type === 'CALLBACK').length, 1);
});

test('C. demande chanson -> CREATE_QUOTE unique', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'CREATE_QUOTE',
    title: 'Préparer la soumission pour la chanson',
    contactId: 'contact-song',
    songRequestId: 'song-req-1',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-req-1',
    isAutoCreated: true,
  }, db);
  await ensureCrmTask({
    type: 'CREATE_QUOTE',
    title: 'Préparer la soumission pour la chanson',
    contactId: 'contact-song',
    songRequestId: 'song-req-1',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-req-1',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.filter((t: MockTask) => t.type === 'CREATE_QUOTE').length, 1);
});

test('D. demande atelier -> CREATE_QUOTE unique', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'CREATE_QUOTE',
    title: "Préparer la soumission pour l'atelier",
    contactId: 'contact-workshop',
    workshopRequestId: 'workshop-req-1',
    linkedType: 'WORKSHOP_REQUEST',
    linkedId: 'workshop-req-1',
    isAutoCreated: true,
  }, db);
  await ensureCrmTask({
    type: 'CREATE_QUOTE',
    title: "Préparer la soumission pour l'atelier",
    contactId: 'contact-workshop',
    workshopRequestId: 'workshop-req-1',
    linkedType: 'WORKSHOP_REQUEST',
    linkedId: 'workshop-req-1',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.filter((t: MockTask) => t.type === 'CREATE_QUOTE').length, 1);
});

test('E. soumission acceptee -> CREATE_INVOICE unique', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'CREATE_INVOICE',
    title: 'Créer la facture',
    contactId: 'contact-quote',
    commercialQuoteId: 'quote-1',
    songRequestId: 'song-1',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-1',
    isAutoCreated: true,
  }, db);
  await ensureCrmTask({
    type: 'CREATE_INVOICE',
    title: 'Créer la facture',
    contactId: 'contact-quote',
    commercialQuoteId: 'quote-1',
    songRequestId: 'song-1',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-1',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.filter((t: MockTask) => t.type === 'CREATE_INVOICE').length, 1);
});

test('F. facture chanson -> CREATE_SONG unique', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'CREATE_SONG',
    title: 'Créer la chanson et déposer les fichiers',
    contactId: 'contact-fact-song',
    invoiceId: 'invoice-song-1',
    songRequestId: 'song-fact-1',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-fact-1',
    isAutoCreated: true,
  }, db);
  await ensureCrmTask({
    type: 'CREATE_SONG',
    title: 'Créer la chanson et déposer les fichiers',
    contactId: 'contact-fact-song',
    invoiceId: 'invoice-song-1',
    songRequestId: 'song-fact-1',
    linkedType: 'SONG_REQUEST',
    linkedId: 'song-fact-1',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.filter((t: MockTask) => t.type === 'CREATE_SONG').length, 1);
});

test('G. facture atelier -> SCHEDULE_WORKSHOP unique', async () => {
  const db = createMockDb() as any;

  await ensureCrmTask({
    type: 'SCHEDULE_WORKSHOP',
    title: "Planifier l'atelier au calendrier",
    contactId: 'contact-fact-workshop',
    invoiceId: 'invoice-workshop-1',
    workshopRequestId: 'workshop-fact-1',
    linkedType: 'WORKSHOP_REQUEST',
    linkedId: 'workshop-fact-1',
    isAutoCreated: true,
  }, db);
  await ensureCrmTask({
    type: 'SCHEDULE_WORKSHOP',
    title: "Planifier l'atelier au calendrier",
    contactId: 'contact-fact-workshop',
    invoiceId: 'invoice-workshop-1',
    workshopRequestId: 'workshop-fact-1',
    linkedType: 'WORKSHOP_REQUEST',
    linkedId: 'workshop-fact-1',
    isAutoCreated: true,
  }, db);

  assert.equal(db.tasks.filter((t: MockTask) => t.type === 'SCHEDULE_WORKSHOP').length, 1);
});

test('H. completeCrmTask -> DONE + completedAt rempli', async () => {
  const db = createMockDb() as any;
  const created = await ensureCrmTask({
    type: 'FOLLOW_UP',
    title: 'Suivi manuel',
    contactId: 'contact-h',
    linkedType: 'CONTACT',
    linkedId: 'contact-h',
  }, db);

  const updated = await completeCrmTask({ id: created.taskId }, db);

  assert.equal(updated.status, 'DONE');
  assert.ok(updated.completedAt instanceof Date);
});

test('I. cancelCrmTask -> CANCELLED sans suppression physique', async () => {
  const db = createMockDb() as any;
  const created = await ensureCrmTask({
    type: 'FOLLOW_UP',
    title: 'Suivi à annuler',
    contactId: 'contact-i',
    linkedType: 'CONTACT',
    linkedId: 'contact-i',
  }, db);

  const beforeCount = db.tasks.length;
  const updated = await cancelCrmTask({ id: created.taskId }, db);

  assert.equal(updated.status, 'CANCELLED');
  assert.equal(db.tasks.length, beforeCount);
});
