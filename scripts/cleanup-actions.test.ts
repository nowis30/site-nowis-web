/**
 * Tests unitaires pour le système de nettoyage CRM (cleanup-actions).
 * Exécuter avec : npx tsx scripts/cleanup-actions.test.ts
 */

import { checkInvoiceDeletable, buildCleanupWhere } from '../src/lib/cleanup-actions';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// ─── checkInvoiceDeletable ────────────────────────────────────────────────────

console.log('\n=== checkInvoiceDeletable ===');

test('Facture PAID non supprimable', () => {
  const result = checkInvoiceDeletable({ status: 'PAID' });
  assert(!result.canDelete, 'canDelete devrait être false');
  assert(typeof result.reason === 'string', 'reason devrait être un string');
});

test('Facture DRAFT supprimable (sandbox)', () => {
  // Forcer sandbox via env
  const originalEnv = process.env.PAYPAL_ENV;
  process.env.PAYPAL_ENV = 'sandbox';
  const result = checkInvoiceDeletable({ status: 'DRAFT', paypalStatus: null, paypalInvoiceId: null, paypalPaidAt: null });
  process.env.PAYPAL_ENV = originalEnv;
  assert(result.canDelete, 'canDelete devrait être true pour une facture DRAFT sandbox');
});

test('Facture SENT en mode live non supprimable', () => {
  const originalEnv = process.env.PAYPAL_ENV;
  process.env.PAYPAL_ENV = 'live';
  const result = checkInvoiceDeletable({ status: 'SENT', paypalStatus: null, paypalInvoiceId: null, paypalPaidAt: null });
  process.env.PAYPAL_ENV = originalEnv;
  assert(!result.canDelete, 'canDelete devrait être false pour SENT en live');
});

test('Facture avec paypalStatus=PAID non supprimable', () => {
  const result = checkInvoiceDeletable({ status: 'DRAFT', paypalStatus: 'PAID' });
  assert(!result.canDelete, 'canDelete devrait être false si paypalStatus=PAID');
});

test('Facture avec paypalPaidAt non supprimable', () => {
  const result = checkInvoiceDeletable({ status: 'DRAFT', paypalPaidAt: new Date() });
  assert(!result.canDelete, 'canDelete devrait être false si paypalPaidAt existe');
});

test('Facture DRAFT sandbox sans PayPal supprimable', () => {
  const originalEnv = process.env.PAYPAL_ENV;
  process.env.PAYPAL_ENV = 'sandbox';
  const result = checkInvoiceDeletable({
    status: 'DRAFT',
    paypalStatus: null,
    paypalInvoiceId: null,
    paypalPaidAt: null,
  });
  process.env.PAYPAL_ENV = originalEnv;
  assert(result.canDelete, 'Facture DRAFT sandbox sans PayPal doit être supprimable');
});

test('Facture avec paypalInvoiceId en live non supprimable', () => {
  const originalEnv = process.env.PAYPAL_ENV;
  process.env.PAYPAL_ENV = 'live';
  const result = checkInvoiceDeletable({
    status: 'DRAFT',
    paypalStatus: null,
    paypalInvoiceId: 'INV2-XXXX-LIVE',
    paypalPaidAt: null,
  });
  process.env.PAYPAL_ENV = originalEnv;
  assert(!result.canDelete, 'Facture avec paypalInvoiceId en live doit être non supprimable');
});

// ─── buildCleanupWhere ────────────────────────────────────────────────────────

console.log('\n=== buildCleanupWhere ===');

test('Vue active exclut isTest et archivés', () => {
  const where = buildCleanupWhere('active', false);
  assert(where !== null, 'where ne doit pas être null');
  assert((where as Record<string, unknown>).isTest === false, 'isTest doit être false');
  assert((where as Record<string, unknown>).archivedAt === null, 'archivedAt doit être null');
  assert((where as Record<string, unknown>).deletedAt === null, 'deletedAt doit être null');
});

test('Vue test ne retourne que les items test', () => {
  const where = buildCleanupWhere('test', false);
  assert(where !== null, 'where ne doit pas être null');
  assert((where as Record<string, unknown>).isTest === true, 'isTest doit être true');
});

test('Vue archived ne retourne que les archivés', () => {
  const where = buildCleanupWhere('archived', false);
  assert(where !== null, 'where ne doit pas être null');
  const archivedAt = (where as Record<string, unknown>).archivedAt as Record<string, unknown>;
  assert(archivedAt?.not === null, 'archivedAt.not doit être null');
});

test('Vue trash réservée aux admins — refusée pour non-admin', () => {
  const where = buildCleanupWhere('trash', false);
  assert(where === null, 'Vue trash doit retourner null pour non-admin');
});

test('Vue all réservée aux admins — refusée pour non-admin', () => {
  const where = buildCleanupWhere('all', false);
  assert(where === null, 'Vue all doit retourner null pour non-admin');
});

test('Vue all autorisée pour admin', () => {
  const where = buildCleanupWhere('all', true);
  assert(where !== null, 'Vue all doit être autorisée pour admin');
  assert(Object.keys(where as object).length === 0, 'Vue all ne doit avoir aucun filtre');
});

test('Vue trash autorisée pour admin', () => {
  const where = buildCleanupWhere('trash', true);
  assert(where !== null, 'Vue trash doit être autorisée pour admin');
  const deletedAt = (where as Record<string, unknown>).deletedAt as Record<string, unknown>;
  assert(deletedAt?.not === null, 'deletedAt.not doit être null pour la corbeille');
});

test('Vue undefined par défaut = active', () => {
  const where = buildCleanupWhere(undefined, false);
  assert(where !== null, 'where ne doit pas être null');
  assert((where as Record<string, unknown>).isTest === false, 'Vue par défaut doit exclure les tests');
});

// ─── Résumé ───────────────────────────────────────────────────────────────────

console.log(`\n=== Résultats : ${passed} ✅  ${failed} ❌ ===\n`);
if (failed > 0) process.exit(1);
