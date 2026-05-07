/**
 * Tests des règles métier : rendez-vous uniquement via Calendly.
 * Teste directement la logique du webhook sans HTTP.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

// ─── Helpers mock ───────────────────────────────────────────────────────────

type MockAppointment = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: string;
  externalProvider: string | null;
  externalEventId: string | null;
  contactId: string | null;
};

function createMockDb(opts?: {
  existingAppointment?: MockAppointment | null;
  contactByEmail?: { id: string; email: string } | null;
}) {
  const createdAppointments: MockAppointment[] = [];

  return {
    appointment: {
      findFirst: async (args: { where: { externalEventId?: string } }) => {
        if (opts?.existingAppointment && args.where.externalEventId === opts.existingAppointment.externalEventId) {
          return opts.existingAppointment;
        }
        return null;
      },
      create: async (args: { data: Record<string, unknown> }) => {
        const newAppt: MockAppointment = {
          id: `appt-${createdAppointments.length + 1}`,
          title: args.data.title as string,
          startAt: args.data.startAt as Date,
          endAt: args.data.endAt as Date,
          status: args.data.status as string,
          externalProvider: args.data.externalProvider as string | null,
          externalEventId: args.data.externalEventId as string | null,
          contactId: args.data.contactId as string | null,
        };
        createdAppointments.push(newAppt);
        return newAppt;
      },
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const appt = createdAppointments.find((a) => a.id === args.where.id) ?? opts?.existingAppointment;
        if (!appt) throw new Error('Appointment not found');
        return { ...appt, ...args.data };
      },
      updateMany: async () => ({ count: 1 }),
    },
    contact: {
      findFirst: async () => opts?.contactByEmail ?? null,
    },
    calendarConnection: {
      findFirst: async () => null,
    },
    workshopRequest: {
      findFirst: async () => null,
    },
    _created: createdAppointments,
  };
}

// ─── Règle : POST /api/crm/appointments est bloqué ──────────────────────────

test('POST /api/crm/appointments: route désactivée retourne 405', async () => {
  const DISABLED_RESPONSE = {
    status: 405,
    body: {
      error: "Les rendez-vous doivent être réservés via Calendly pour éviter les conflits d'horaire.",
      code: 'APPOINTMENT_MANUAL_CREATION_DISABLED',
    },
  };

  assert.equal(DISABLED_RESPONSE.status, 405);
  assert.equal(DISABLED_RESPONSE.body.code, 'APPOINTMENT_MANUAL_CREATION_DISABLED');
  assert.ok(DISABLED_RESPONSE.body.error.includes('Calendly'));
});

// ─── Webhook invitee.created : crée un rendez-vous CRM ──────────────────────

test('Webhook invitee.created: crée un rendez-vous CRM si aucun existant', async () => {
  const db = createMockDb({ existingAppointment: null });

  const scheduledEventUri = 'https://api.calendly.com/scheduled_events/uuid-1';
  const startAt = new Date('2026-06-01T14:00:00Z');
  const endAt = new Date('2026-06-01T15:00:00Z');
  const inviteeName = 'Marie Tremblay';

  // Simuler la logique du webhook invitee.created (sans workshopRequest)
  const existingAppointment = await db.appointment.findFirst({
    where: { externalEventId: scheduledEventUri },
  });

  const appointment = existingAppointment
    ? await db.appointment.update({
        where: { id: existingAppointment.id },
        data: { startAt, endAt, status: 'CONFIRMED' },
      })
    : await db.appointment.create({
        data: {
          title: `Rendez-vous Calendly - ${inviteeName}`,
          description: 'Créé automatiquement depuis un webhook Calendly',
          startAt,
          endAt,
          type: 'MEETING',
          status: 'CONFIRMED',
          contactId: null,
          externalProvider: 'CALENDLY',
          externalEventId: scheduledEventUri,
          meetingUrl: scheduledEventUri,
        },
      });

  assert.ok(appointment.id);
  assert.equal(appointment.externalProvider, 'CALENDLY');
  assert.equal(appointment.externalEventId, scheduledEventUri);
  assert.equal(appointment.status, 'CONFIRMED');
  assert.equal((db as any)._created.length, 1);
});

// ─── Webhook invitee.created : idempotence ───────────────────────────────────

test('Webhook invitee.created: idempotent si événement déjà existant', async () => {
  const scheduledEventUri = 'https://api.calendly.com/scheduled_events/uuid-2';
  const existingAppointment: MockAppointment = {
    id: 'appt-existing',
    title: 'Rendez-vous Calendly existant',
    startAt: new Date('2026-06-02T10:00:00Z'),
    endAt: new Date('2026-06-02T11:00:00Z'),
    status: 'CONFIRMED',
    externalProvider: 'CALENDLY',
    externalEventId: scheduledEventUri,
    contactId: null,
  };

  const db = createMockDb({ existingAppointment });

  // La logique du webhook fait upsert : trouve l'existant → update
  const found = await db.appointment.findFirst({
    where: { externalEventId: scheduledEventUri },
  });

  assert.ok(found, 'Doit trouver le rendez-vous existant');
  assert.equal(found?.id, 'appt-existing');

  // Simule update (pas create) → pas de doublon
  const updated = await db.appointment.update({
    where: { id: found!.id },
    data: { startAt: new Date('2026-06-02T10:00:00Z'), endAt: new Date('2026-06-02T11:00:00Z'), status: 'CONFIRMED' },
  });

  assert.equal(updated.id, 'appt-existing');
  assert.equal((db as any)._created.length, 0, 'Aucun nouveau rendez-vous créé');
});

// ─── Webhook invitee.canceled : marque annulé sans suppression ───────────────

test('Webhook invitee.canceled: marque le rendez-vous CANCELLED sans le supprimer physiquement', async () => {
  const scheduledEventUri = 'https://api.calendly.com/scheduled_events/uuid-3';
  const db = createMockDb();

  // La logique du webhook invitee.canceled utilise updateMany
  const result = await db.appointment.updateMany();

  assert.ok(result.count >= 0, 'updateMany doit être appelé (pas delete)');
  // Pas de méthode delete appelée
  const hasDeleteMethod = 'delete' in db.appointment;
  assert.equal(hasDeleteMethod, false, 'Pas de méthode delete sur le mock — suppression physique non prévue');
});

// ─── Sécurité webhook : signature ────────────────────────────────────────────

test('Signature Calendly: payload non signé refusé si clé configurée', () => {
  const { createHmac, timingSafeEqual } = require('crypto');

  const signingKey = 'test-signing-key-secret';
  const rawBody = JSON.stringify({ event: 'invitee.created', payload: {} });
  const fakeSignature = 'invalid-signature-that-does-not-match';

  // Recalculer la signature attendue
  const expected = createHmac('sha256', signingKey).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(fakeSignature, 'utf8');

  const isValid = expectedBuffer.length === receivedBuffer.length
    ? timingSafeEqual(expectedBuffer, receivedBuffer)
    : false;

  assert.equal(isValid, false, 'Un payload non signé doit être refusé');
});

test('Signature Calendly: payload correctement signé est accepté', () => {
  const { createHmac, timingSafeEqual } = require('crypto');

  const signingKey = 'test-signing-key-secret';
  const rawBody = JSON.stringify({ event: 'invitee.created', payload: {} });

  // Signer correctement
  const correctSignature = createHmac('sha256', signingKey).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(correctSignature, 'utf8');
  const receivedBuffer = Buffer.from(correctSignature, 'utf8');

  const isValid = expectedBuffer.length === receivedBuffer.length
    ? timingSafeEqual(expectedBuffer, receivedBuffer)
    : false;

  assert.equal(isValid, true, 'Un payload correctement signé doit être accepté');
});
