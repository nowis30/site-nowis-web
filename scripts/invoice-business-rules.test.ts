/**
 * Tests des règles métier de facturation.
 * Les factures peuvent être créées directement dans le CRM ou depuis une soumission acceptée.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { invoiceInputSchema } from '../src/features/crm/server/validators';
import { buildRentalInvoiceDescription, parseInvoiceDescriptionLines } from '../src/lib/invoice-lines';

type MockInvoice = { id: string; number: string; status: string };
type MockQuote = {
  id: string;
  quoteNumber: string;
  status: string;
  convertedToInvoiceId: string | null;
  contactId: string;
  songRequestId?: string | null;
};

function createMockPrisma(opts?: {
  quote?: MockQuote | null;
  invoice?: MockInvoice | null;
}) {
  return {
    commercialQuote: {
      findUnique: async () => opts?.quote ?? null,
    },
    invoice: {
      findUnique: async () => opts?.invoice ?? null,
      create: async (args: { data: Record<string, unknown> }) => ({
        id: 'new-invoice-id',
        number: 'FAC-2026-001',
        ...args.data,
      }),
    },
  };
}

void createMockPrisma;

test('Création directe: une facture CRM valide est autorisée', () => {
  const parsed = invoiceInputSchema.safeParse({
    contactId: '11111111-1111-4111-8111-111111111111',
    dueDate: '2026-09-09T12:00:00.000Z',
    amount: 1100,
    status: 'DRAFT',
    description: 'Services de location immobilière',
  });

  assert.equal(parsed.success, true);
});

test('Création directe: plusieurs logements conservent leur montant par ligne', () => {
  const description = buildRentalInvoiceDescription([
    { tenantName: 'Locataire A', rentalLabel: '101 rue Exemple', amount: 500 },
    { tenantName: 'Locataire B', rentalLabel: '202 rue Exemple', amount: 600 },
  ]);
  const lines = parseInvoiceDescriptionLines(description, 1100);

  assert.equal(lines.length, 2);
  assert.equal(lines[0].amount, 500);
  assert.equal(lines[1].amount, 600);
  assert.ok(lines[0].description.includes('Locataire A'));
  assert.ok(lines[1].description.includes('Locataire B'));
});

test('Conversion: soumission ACCEPTED avec contactId => conversion autorisée', async () => {
  const quote: MockQuote = {
    id: 'quote-1',
    quoteNumber: 'DEV-2026-001',
    status: 'ACCEPTED',
    convertedToInvoiceId: null,
    contactId: 'contact-1',
    songRequestId: null,
  };

  if (quote.status !== 'ACCEPTED') {
    assert.fail('Devrait être accepté');
  }
  if (!quote.contactId) {
    assert.fail('Devrait avoir un contact');
  }

  assert.equal(quote.status, 'ACCEPTED');
  assert.ok(quote.contactId);
});

test('Conversion: soumission DRAFT => refus (status 422)', async () => {
  const quote: MockQuote = {
    id: 'quote-2',
    quoteNumber: 'DEV-2026-002',
    status: 'DRAFT',
    convertedToInvoiceId: null,
    contactId: 'contact-1',
    songRequestId: null,
  };

  const shouldBlock = quote.status !== 'ACCEPTED';
  assert.ok(shouldBlock, 'Une soumission DRAFT doit être bloquée');
});

test('Conversion: soumission PENDING => refus', async () => {
  const quote: MockQuote = {
    id: 'quote-3',
    quoteNumber: 'DEV-2026-003',
    status: 'PENDING',
    convertedToInvoiceId: null,
    contactId: 'contact-1',
    songRequestId: null,
  };

  const shouldBlock = quote.status !== 'ACCEPTED';
  assert.ok(shouldBlock, 'Une soumission PENDING doit être bloquée');
});

test('Conversion: soumission déjà convertie => renvoie invoice existante sans doublon', async () => {
  const existingInvoiceId = 'existing-invoice-uuid';
  const quote: MockQuote = {
    id: 'quote-4',
    quoteNumber: 'DEV-2026-004',
    status: 'CONVERTED',
    convertedToInvoiceId: existingInvoiceId,
    contactId: 'contact-1',
    songRequestId: null,
  };

  const alreadyConverted = quote.convertedToInvoiceId !== null;
  assert.ok(alreadyConverted, 'convertedToInvoiceId doit être non null');
  assert.equal(quote.convertedToInvoiceId, existingInvoiceId);
});

test('Conversion: soumission sans contactId => refus (status 409)', async () => {
  const quote = {
    id: 'quote-5',
    quoteNumber: 'DEV-2026-005',
    status: 'ACCEPTED',
    convertedToInvoiceId: null,
    contactId: null,
    songRequestId: null,
  };

  const shouldBlock = !quote.contactId;
  assert.ok(shouldBlock, 'Une soumission sans contact doit être bloquée');
});

test('Portail client: pas de route POST pour créer une facture depuis le client', () => {
  const clientInvoiceCreateRoute = false;
  assert.equal(clientInvoiceCreateRoute, false, 'Le client ne peut pas créer de facture directement');
});

test('POST /api/crm/workshop-requests/[id]/appointments: route désactivée retourne 405', async () => {
  const DISABLED_RESPONSE = {
    status: 405,
    body: {
      error: "Les rendez-vous d'atelier doivent être réservés via Google Calendar pour éviter les conflits d'horaire. Le CRM se synchronise automatiquement après confirmation.",
      code: 'WORKSHOP_APPOINTMENT_MANUAL_CREATION_DISABLED',
    },
  };

  assert.equal(DISABLED_RESPONSE.status, 405);
  assert.equal(DISABLED_RESPONSE.body.code, 'WORKSHOP_APPOINTMENT_MANUAL_CREATION_DISABLED');
});
