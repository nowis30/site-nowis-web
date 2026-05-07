import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canClientAccessSongRequest,
  canClientAccessWorkshopRequest,
  isOwnedByContact,
} from '@/features/client-portal/documents/security';

function createMockDb() {
  const songs = [
    { id: 'song-a', contactId: 'contact-a' },
    { id: 'song-b', contactId: 'contact-b' },
  ];

  const workshops = [
    { id: 'workshop-a', contactId: 'contact-a', clientId: null },
    { id: 'workshop-b', contactId: 'contact-b', clientId: 'contact-b' },
  ];

  return {
    songRequest: {
      findFirst: async (args: any) => songs.find((song) => song.id === args.where.id && song.contactId === args.where.contactId) ?? null,
    },
    workshopRequest: {
      findFirst: async (args: any) => workshops.find((w) => {
        if (w.id !== args.where.id) return false;
        const contactId = args.where.OR?.[0]?.contactId;
        const clientId = args.where.OR?.[1]?.clientId;
        return w.contactId === contactId || w.clientId === clientId;
      }) ?? null,
    },
  };
}

test('J1. client A ne peut pas voir les documents du client B (ownership direct)', () => {
  assert.equal(isOwnedByContact('contact-b', 'contact-a'), false);
});

test('J2. client A ne peut pas uploader dans la chanson du client B', async () => {
  const db = createMockDb() as any;
  const allowed = await canClientAccessSongRequest({
    songRequestId: 'song-b',
    sessionContactId: 'contact-a',
    db,
  });

  assert.equal(allowed, false);
});

test('J3. client A peut uploader dans sa propre chanson', async () => {
  const db = createMockDb() as any;
  const allowed = await canClientAccessSongRequest({
    songRequestId: 'song-a',
    sessionContactId: 'contact-a',
    db,
  });

  assert.equal(allowed, true);
});

test('J4. client A ne peut pas uploader dans l atelier du client B', async () => {
  const db = createMockDb() as any;
  const allowed = await canClientAccessWorkshopRequest({
    workshopRequestId: 'workshop-b',
    sessionContactId: 'contact-a',
    db,
  });

  assert.equal(allowed, false);
});

test('J5. client A peut uploader dans son propre atelier', async () => {
  const db = createMockDb() as any;
  const allowed = await canClientAccessWorkshopRequest({
    workshopRequestId: 'workshop-a',
    sessionContactId: 'contact-a',
    db,
  });

  assert.equal(allowed, true);
});
