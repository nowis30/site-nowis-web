import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canClientAccessFileDocument,
  canClientAccessInvoice,
  canClientAccessSongRequest,
  canClientAccessWorkshopRequest,
  isOwnedByContact,
} from '@/features/client-portal/documents/security';
import { CLIENT_PORTAL_FILE_DOCUMENTS_PREFIX } from '@/features/client-portal/documents/paths';

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
    invoice: {
      findFirst: async (args: any) => {
        if (args.where.id === 'invoice-a' && args.where.contactId === 'contact-a') return { id: 'invoice-a' };
        if (args.where.id === 'invoice-b' && args.where.contactId === 'contact-b') return { id: 'invoice-b' };
        return null;
      },
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

test('J6. client A peut lire/télécharger son document invoice', async () => {
  const db = createMockDb() as any;
  const invoiceAllowed = await canClientAccessInvoice({
    invoiceId: 'invoice-a',
    sessionContactId: 'contact-a',
    db,
  });
  assert.equal(invoiceAllowed, true);

  const docAllowed = canClientAccessFileDocument({
    sessionContactId: 'contact-a',
    visibility: 'CLIENT_VISIBLE',
    category: 'invoice',
    invoiceContactId: 'contact-a',
  });
  assert.equal(docAllowed, true);
});

test('J7. client B ne peut pas lire/télécharger le document invoice du client A', () => {
  const allowed = canClientAccessFileDocument({
    sessionContactId: 'contact-b',
    visibility: 'CLIENT_VISIBLE',
    category: 'invoice',
    invoiceContactId: 'contact-a',
  });
  assert.equal(allowed, false);
});

test('J8. client A voit son invoice dans Mes documents (section invoice)', () => {
  const allowed = canClientAccessFileDocument({
    sessionContactId: 'contact-a',
    visibility: 'CLIENT_VISIBLE',
    category: 'invoice',
    invoiceContactId: 'contact-a',
  });
  assert.equal(allowed, true);
});

test('J9. document admin-internal reste interdit côté client', () => {
  const allowed = canClientAccessFileDocument({
    sessionContactId: 'contact-a',
    visibility: 'CLIENT_VISIBLE',
    category: 'admin-internal',
    contactId: 'contact-a',
  });
  assert.equal(allowed, false);
});

test('J10. le lien de téléchargement client utilise une route client (pas CRM)', () => {
  assert.equal(CLIENT_PORTAL_FILE_DOCUMENTS_PREFIX, '/api/client-portal/file-documents');
  assert.equal(CLIENT_PORTAL_FILE_DOCUMENTS_PREFIX.startsWith('/api/crm/'), false);
});
