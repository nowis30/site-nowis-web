import assert from 'node:assert/strict';
import test from 'node:test';
import { assertFileContentSignature } from '@/lib/file-content-signature';
import { isPrivatePagePath } from '@/lib/private-page-path';
test('declared document types cannot disguise HTML, executable or binary content; supported signatures remain accepted', () => {
  const examples: Array<[string, Uint8Array]> = [
    ['application/pdf', Buffer.from('%PDF-1.7 isolated')], ['image/png', Uint8Array.from([137,80,78,71,13,10,26,10])],
    ['image/jpeg', Uint8Array.from([255,216,255,224])], ['image/webp', Buffer.from('RIFF0000WEBP')],
    ['audio/wav', Buffer.from('RIFF0000WAVE')], ['audio/mpeg', Buffer.from('ID3isolated')],
    ['audio/mp4', Buffer.from('0000ftypM4A ')], ['video/mp4', Buffer.from('0000ftypisom')],
    ['application/msword', Uint8Array.from([208,207,17,224,161,177,26,225])],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', Uint8Array.from([80,75,3,4,0])], ['text/plain', Buffer.from('Texte français\n')],
  ];
  for (const [mime, bytes] of examples) {
    assert.doesNotThrow(() => assertFileContentSignature(bytes, mime), mime);
    if (mime !== 'text/plain') assert.throws(() => assertFileContentSignature(Buffer.from('<html><script>attack</script>'), mime), /format déclaré/, mime);
    assert.throws(() => assertFileContentSignature(Buffer.from('MZ\0\0executable'), mime), /format déclaré/, mime);
  }
  assert.throws(() => assertFileContentSignature(Uint8Array.from([255,255]), 'text/plain'));
  assert.throws(() => assertFileContentSignature(Buffer.from('data'), 'text/html'));
});
test('document capabilities, authentication and reset pages never qualify for analytics page views', () => {
  for (const path of ['/facture/private-token', '/soumission/private-token', '/facturation/private-token', '/crm/login', '/connexion', '/reinitialiser-mot-de-passe', '/mot-de-passe-oublie', '/client/dashboard']) assert.equal(isPrivatePagePath(path), true);
  for (const path of ['/', '/album', '/radio', '/tarot', '/ateliers']) assert.equal(isPrivatePagePath(path), false);
});
