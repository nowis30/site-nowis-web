import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getClientDocumentSection,
  normalizeDocumentCategory,
  resolveDocumentCategory,
  resolveDocumentOrigin,
} from '@/features/documents/document-categories';

test('normalizeDocumentCategory garde les categories officielles', () => {
  assert.equal(normalizeDocumentCategory('quote'), 'quote');
  assert.equal(normalizeDocumentCategory('song-audio'), 'song-audio');
  assert.equal(normalizeDocumentCategory('admin-internal'), 'admin-internal');
});

test('normalizeDocumentCategory convertit les valeurs legacy', () => {
  assert.equal(normalizeDocumentCategory('document'), 'client-shared');
  assert.equal(normalizeDocumentCategory('facture'), 'invoice');
  assert.equal(normalizeDocumentCategory('soumission'), 'quote');
});

test('normalizeDocumentCategory retourne other pour valeur invalide', () => {
  assert.equal(normalizeDocumentCategory('valeur-inconnue'), 'other');
  assert.equal(normalizeDocumentCategory(''), 'other');
});

test('fallback mimeType utilise seulement si categorie absente ou invalide', () => {
  const explicit = resolveDocumentCategory({
    category: 'song-video',
    mimeType: 'audio/mpeg',
    songRequestId: 'song-1',
  });
  assert.equal(explicit.category, 'song-video');
  assert.equal(explicit.source, 'explicit');

  const legacy = resolveDocumentCategory({
    category: 'document',
    mimeType: 'video/mp4',
    songRequestId: 'song-1',
  });
  assert.equal(legacy.category, 'client-shared');
  assert.equal(legacy.source, 'legacy-normalized');

  const fallback = resolveDocumentCategory({
    category: 'categorie-invalide',
    mimeType: 'video/mp4',
    songRequestId: 'song-1',
  });
  assert.equal(fallback.category, 'song-video');
  assert.equal(fallback.source, 'fallback');
});

test('groupement client Mes documents classe selon les sections officielles', () => {
  assert.equal(getClientDocumentSection({ category: 'quote' }), 'quotes');
  assert.equal(getClientDocumentSection({ category: 'invoice' }), 'invoices');
  assert.equal(getClientDocumentSection({ category: 'client-shared' }), 'shared');
  assert.equal(getClientDocumentSection({ category: 'song-audio' }), 'song-deliverables');
  assert.equal(getClientDocumentSection({ category: 'workshop-video' }), 'workshop-deliverables');
  assert.equal(getClientDocumentSection({ category: 'inconnu', mimeType: 'application/pdf', uploadedByUserId: 'admin-1' }), 'other');
});

test('mapping origine CRM reflète le contexte du document', () => {
  assert.equal(resolveDocumentOrigin({ commercialQuoteId: 'q1' }), 'soumission');
  assert.equal(resolveDocumentOrigin({ invoiceId: 'i1' }), 'facture');
  assert.equal(resolveDocumentOrigin({ songRequestId: 's1' }), 'chanson');
  assert.equal(resolveDocumentOrigin({ workshopRequestId: 'w1' }), 'atelier');
  assert.equal(resolveDocumentOrigin({ uploadedByUserId: null, visibility: 'CLIENT_VISIBLE' }), 'client');
});
