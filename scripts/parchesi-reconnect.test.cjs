const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const html = fs.readFileSync('public/jeux/parchesi/index.html', 'utf8');
const methodStart = html.indexOf('  onMsg(c, m) {');
const methodEnd = html.indexOf('  processIntents() {', methodStart);
assert.ok(methodStart > 0 && methodEnd > methodStart);
const method = html.slice(methodStart, methodEnd).trim().replace(/,$/, '');
const credential = 'a'.repeat(64);

function scenario(inProgress = true) {
  const player = { wasHuman: true, owner: 'original', name: 'Testeur', type: 'humain', color: 'rouge' };
  let closed = false;
  const messages = [];
  const context = vm.createContext({
    game: inProgress ? { players: [player] } : null, setup: { online: true }, PROTO: 4,
    busy: true, log() {}, toast() {}, pname() { return 'Testeur'; }, updateHUD() {}, setTimeout() {},
    makeReconnectToken: () => Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex')
  });
  const handler = vm.runInContext('({' + method + '}).onMsg', context);
  const client = { conn: { id: 'new', send(message) { messages.push(message); } }, ready: false };
  const host = {
    clients: new Map([['original', { conn: { close() { closed = true; } } }], ['new', client]]),
    reconnectTokens: new Map([[credential, 'original']]), seq: 1,
    lobby: { seats: [{ type: 'absent', color: 'rouge' }, { type: 'absent', color: 'bleu' }] },
    sync() {}, pushLobby() {}, uniqueName(name) { return name; }
  };
  return { player, host, client, messages, get closed() { return closed; },
    hello(extra = {}) { handler.call(host, client, { t: 'hello', v: 4, name: 'Testeur', ...extra }); } };
}

test('same nickname without a credential cannot take or disconnect a player', () => {
  const s = scenario(); s.hello();
  assert.equal(s.player.owner, 'original'); assert.equal(s.closed, false);
  assert.equal(s.messages[0].color, null);
  assert.equal(s.messages[0].reconnectToken, undefined);
});
test('a forged credential cannot claim a seat', () => {
  const s = scenario(); s.hello({ reconnectToken: 'b'.repeat(64) });
  assert.equal(s.player.owner, 'original'); assert.equal(s.closed, false);
});
test('the legitimate credential resumes the same seat and replaces its old connection', () => {
  const s = scenario(); s.hello({ reconnectToken: credential, name: 'Different name' });
  assert.equal(s.player.owner, 'new'); assert.equal(s.player.name, 'Testeur'); assert.equal(s.closed, true);
  assert.equal(s.host.reconnectTokens.get(credential), 'new');
  assert.equal(s.messages[0].reconnectToken, credential);
  assert.equal(JSON.stringify(s.messages[0].g).includes(credential), false);
  assert.equal(JSON.stringify(s.messages[0].setup).includes(credential), false);
});
test('a lobby credential is private and repeated hello does not occupy two seats', () => {
  const s = scenario(false); s.hello(); s.hello();
  assert.equal(s.messages.length, 1);
  assert.match(s.messages[0].reconnectToken, /^[a-f0-9]{64}$/);
  assert.equal(s.host.lobby.seats.filter(seat => seat.owner === 'new').length, 1);
  assert.equal(JSON.stringify(s.host.lobby).includes(s.messages[0].reconnectToken), false);
});
test('game activation preserves cache namespaces belonging to the rest of the site', async () => {
  const handlers = {}, deleted = [];
  vm.runInNewContext(fs.readFileSync('public/jeux/parchesi/sw.js', 'utf8'), {
    self: { addEventListener(name, fn) { handlers[name] = fn; }, clients: { claim() {} } },
    caches: { keys: async () => ['site-offline-v9', 'parchesi-arcanes-v3-1', 'parchesi-arcanes-v4-1'], delete: async key => deleted.push(key) }
  });
  let pending;
  handlers.activate({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(deleted, ['parchesi-arcanes-v3-1']);
});
