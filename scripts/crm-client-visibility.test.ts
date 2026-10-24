import assert from 'node:assert/strict';
import test from 'node:test';
import { clientVisibleInvoiceWhere } from '@/lib/client-invoice-visibility';
import { safeHttpUrl } from '@/lib/safe-http-url';

test('client invoice filter hides drafts, tests and archived bills unless a PayPal link exists', () => {
  const where = clientVisibleInvoiceWhere('contact-1');
  assert.equal(where.contactId, 'contact-1');
  assert.equal(where.isTest, false);
  assert.equal(where.deletedAt, null);
  assert.equal(where.archivedAt, null);
  const statuses = where.OR?.find((entry) => 'status' in entry && entry.status);
  assert.deepEqual(statuses, { status: { in: ['SENT', 'PAID', 'OVERDUE', 'CANCELLED'] } });
  assert.deepEqual(where.OR?.[1], { paypalInvoiceUrl: { not: null } });
});

test('safeHttpUrl accepts web links and rejects active content', () => {
  assert.equal(safeHttpUrl('https://nowis.store/facture.pdf'), 'https://nowis.store/facture.pdf');
  assert.equal(safeHttpUrl(' http://example.com/a '), 'http://example.com/a');
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,<script>',
    'https://user:secret@nowis.store/file',
    'file:///etc/passwd',
    'not a url',
    '',
  ]) {
    assert.equal(safeHttpUrl(value), null);
  }
});
