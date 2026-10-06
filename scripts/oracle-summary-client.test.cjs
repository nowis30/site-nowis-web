/* Run with: node --test scripts/oracle-summary-client.test.cjs */
'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const readerDirectory = path.join(__dirname, '../public/tarot-reader');
const storageKey = 'nowis-oracle-summary-v1';

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) || []), listener]); }
  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) || []) listener(event);
    return true;
  }
  fire(type, properties = {}) {
    const event = {type, target: this, preventDefault() {}, ...properties};
    return Promise.all((this.listeners.get(type) || []).map(listener => listener(event)));
  }
}

class Element extends Target {
  constructor(id, tagName = 'DIV') {
    super();
    Object.assign(this, {id, tagName, checked: false, disabled: false, hidden: false, textContent: '', children: [], dataset: {}, className: '', attributes: new Map(), innerHTMLWrites: []});
  }
  set innerHTML(value) { this.innerHTMLWrites.push(value); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  closest(selector) { return selector === '[data-summary-remove]' && this.dataset.summaryRemove ? this : null; }
}

const plain = value => JSON.parse(JSON.stringify(value));
const response = (body, status = 200) => ({ok: status >= 200 && status < 300, status, json: async () => body});
const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };
const emptyReading = () => ({drawId: '', question: '', answers: {}, spread: '3', cardIds: [], revealed: []});
const completeReading = (drawId, options = {}) => ({drawId, question: 'Comment aborder cette période ?', answers: {}, spread: '3', cardIds: ['major-0', 'major-1', 'coupes-13'], revealed: [0, 1, 2], ...options});
const completeAstrology = options => ({birthDate: '1990-05-15', birthTime: '14:30', unknownTime: false, latitude: 45.5019, longitude: -73.5674, timeZone: 'America/Toronto', forecastDate: '2026-10-04', placeName: 'Montréal, Québec, Canada', ...options});

async function setup({available = true, storage = new Map(), reading = emptyReading(), astrology = null} = {}) {
  const elements = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  element('summary-result').hidden = true;
  element('summary-ai-controls').hidden = true;
  const state = {reading: plain(reading), astrology: astrology ? plain(astrology) : null};
  const window = new Target();
  window.TAROT_SESSION = {getReading: () => state.reading};
  window.ASTRO_SESSION = {getContext: () => state.astrology};
  let explorations = {};
  window.EXPLORE_SESSION = {getContext:()=>plain(explorations),set:(value)=>{explorations=plain(value);window.dispatchEvent(new Event('explore:changed'));},clear:()=>{explorations={};window.dispatchEvent(new Event('explore:changed'));}};
  const calls = [];
  const posts = [];
  const timers = new Map();
  let timerId = 0;
  const context = vm.createContext({
    window, console, AbortController, Event,
    document: {getElementById: element, createElement: tag => new Element('', tag.toUpperCase())},
    sessionStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
    setTimeout: callback => { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: (url, options = {}) => {
      const call = {url, options}; calls.push(call);
      if (options.method !== 'POST') return Promise.resolve(response({available}));
      // Ignore AbortSignal deliberately: stale responses must still be harmless.
      return new Promise((resolve, reject) => posts.push({...call, resolve, reject}));
    }
  });
  for (const file of ['tarot-data.js', 'tarot-personalization.js', 'oracle-summary.js']) {
    vm.runInContext(fs.readFileSync(path.join(readerDirectory, file), 'utf8'), context, {filename: file});
  }
  await flush();
  return {
    element, window, calls, posts, storage, timers,
    saved: () => JSON.parse(storage.get(storageKey)),
    setReading: async value => { state.reading = plain(value); await window.fire('tarot:changed'); },
    setAstrology: async value => { state.astrology = value ? plain(value) : null; await window.fire('astro:changed'); },
    consent: async value => { element('summary-consent').checked = value; await element('summary-consent').fire('change'); },
    request: () => element('summary-request').fire('click'),
    remove: async index => {
      const entry = element('summary-readings').children[index];
      await element('summary-readings').fire('click', {target: entry.children.at(-1)});
    },
    clear: () => element('summary-clear').fire('click'),
    finish: async (request, reply = 'Une lecture symbolique qui laisse vos choix ouverts.', status = 200, mode = 'ai') => {
      request.resolve(response({mode, reply}, status)); await flush();
    }
  };
}

test('explorations alone require consent, stay out of storage and invalidate stale replies', async()=>{
  const page=await setup();
  const value={numerology:{birthDate:'1980-10-22',date:'2026-10-06',name:'Fiction Exemple'}};
  page.window.EXPLORE_SESSION.set(value);
  assert.equal(page.element('summary-request').disabled,true);
  assert.ok(page.element('summary-explore-status').textContent.includes('Numérologie'));
  await page.consent(true);
  const pending=page.request();
  const request=page.posts[0];
  assert.deepEqual(JSON.parse(request.options.body).explorations,value);
  assert.ok(!JSON.stringify(page.saved()).includes('Fiction'));
  page.window.EXPLORE_SESSION.clear();
  assert.equal(request.options.signal.aborted,true);
  assert.equal(page.element('summary-consent').checked,false);
  await page.finish(request);await pending;
  assert.equal(page.element('summary-result').hidden,true);
  assert.equal(page.element('summary-request').disabled,true);
});

test('loading performs only a capability GET, and consent cannot authorize empty or partly revealed input', async () => {
  const page = await setup();
  assert.equal(page.calls.length, 1);
  assert.equal(page.calls[0].url, '/api/tarot/conclusion');
  assert.equal(page.calls[0].options.method, undefined);
  assert.equal(page.calls[0].options.cache, 'no-store');
  await page.consent(true);
  await page.request();
  assert.equal(page.posts.length, 0);
  await page.setReading(completeReading('draw-1', {revealed: [0, 1]}));
  await page.consent(true);
  await page.request();
  assert.equal(page.posts.length, 0);
  assert.equal(page.saved().readings.length, 0);
  await page.setReading(completeReading('draw-1'));
  await page.request();
  assert.equal(page.posts.length, 0, 'revealing the last card revokes earlier consent');
});

test('no request is possible when the capability is unavailable', async () => {
  const page = await setup({available: false, reading: completeReading('draw-1'), astrology: completeAstrology()});
  await page.consent(true);
  await page.request();
  assert.equal(page.posts.length, 0);
  assert.equal(page.element('summary-ai-controls').hidden, true);
  assert.equal(page.element('summary-request').disabled, true);
});

test('five completed draws are retained, identical cards from distinct draw IDs remain separate, and an edit updates its draw', async () => {
  const page = await setup();
  for (let index = 1; index <= 6; index++) await page.setReading(completeReading(`draw-${index}`, {question: `Question ${index}`}));
  assert.deepEqual(page.saved().readings.map(value => value.drawId), ['draw-2', 'draw-3', 'draw-4', 'draw-5', 'draw-6']);
  assert.match(page.element('summary-count').textContent, /5.*sur 5/);
  await page.setReading(completeReading('draw-6', {question: 'Question modifiée', answers: {situation: 'Un contexte actualisé'}}));
  assert.equal(page.saved().readings.length, 5);
  assert.equal(page.saved().readings.at(-1).question, 'Question modifiée');
  assert.equal(page.saved().readings.at(-1).answers.situation, 'Un contexte actualisé');
});

test('the submitted snapshot contains only the authorized inputs, in draw and card order', async () => {
  const storage = new Map([['nowis-oracle-carnet-v1', JSON.stringify({journal: 'PRIVATE_DIARY'})]]);
  const page = await setup({storage});
  let conclusionScrolls = 0;
  page.window.addEventListener('oracle:scroll-summary-result', () => conclusionScrolls++);
  await page.setReading(completeReading('draw-1', {question: '  Première question  ', answers: {situation: 'Situation', goal: 'Comprendre', feeling: 'serein', blocker: 'aucun', journal: 'PRIVATE_ANSWER_FIELD'}}));
  await page.setReading(completeReading('draw-2', {question: 'Seconde question', spread: '2', cardIds: ['major-3', 'major-2'], revealed: [0, 1], journal: 'PRIVATE_READING_FIELD'}));
  await page.setAstrology(completeAstrology({journal: 'PRIVATE_ASTRO_FIELD', positions: [{fake: true}], providerKey: 'PRIVATE_PROVIDER_FIELD', disambiguation: ''}));
  await page.consent(true);
  const pending = page.request();
  assert.equal(page.posts.length, 1);
  const request = page.posts[0];
  const payload = JSON.parse(request.options.body);
  assert.deepEqual(Object.keys(payload), ['consent', 'readings', 'astrology']);
  assert.equal(payload.consent, true);
  assert.deepEqual(payload.readings.map(value => value.cardIds), [['major-0', 'major-1', 'coupes-13'], ['major-3', 'major-2']]);
  assert.deepEqual(Object.keys(payload.readings[0]), ['question', 'answers', 'spread', 'cardIds']);
  assert.equal(payload.readings[0].question, 'Première question');
  assert.deepEqual(Object.keys(payload.astrology), ['birthDate', 'birthTime', 'unknownTime', 'latitude', 'longitude', 'timeZone', 'forecastDate', 'placeName']);
  assert.ok(!request.options.body.includes('PRIVATE_'));
  assert.ok(!request.options.body.includes('drawId'));
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.url, '/api/tarot/conclusion');
  assert.equal(page.element('summary-request').disabled, true);
  await page.request();
  assert.equal(page.posts.length, 1, 'a busy conclusion cannot be submitted twice');
  await page.finish(request);
  await pending;
  assert.equal(page.element('summary-result').hidden, false);
  assert.equal(conclusionScrolls, 1, 'a current successful answer asks the iframe parent to show the conclusion');
  assert.equal(page.storage.get('nowis-oracle-carnet-v1'), JSON.stringify({journal: 'PRIVATE_DIARY'}));
  assert.ok(!page.storage.get(storageKey).includes('birthDate'));
  assert.ok(!page.storage.get(storageKey).includes('Une lecture symbolique'));
});

test('an astrology-only conclusion accepts unknown birth time and sends no draws', async () => {
  const page = await setup({astrology: completeAstrology({unknownTime: true, birthTime: '', disambiguation: 'earlier'})});
  await page.consent(true);
  const pending = page.request();
  const payload = JSON.parse(page.posts[0].options.body);
  assert.deepEqual(payload.readings, []);
  assert.equal(payload.astrology.unknownTime, true);
  assert.equal(payload.astrology.birthTime, '');
  assert.equal(payload.astrology.disambiguation, 'earlier');
  await page.finish(page.posts[0]); await pending;
});

test('a draw-only conclusion omits astrology altogether', async () => {
  const page = await setup({reading: completeReading('draw-1')});
  await page.consent(true);
  const pending = page.request();
  assert.equal('astrology' in JSON.parse(page.posts[0].options.body), false);
  await page.finish(page.posts[0]); await pending;
});

test('incomplete or impossible birth details are not silently sent as valid astrology', async () => {
  for (const invalid of [completeAstrology({birthDate: '1990-02-31'}), completeAstrology({latitude: 91}), completeAstrology({birthTime: '25:00'}), completeAstrology({forecastDate: ''})]) {
    const page = await setup({astrology: invalid});
    await page.consent(true); await page.request();
    assert.equal(page.posts.length, 0);
    assert.match(page.element('summary-astro-status').textContent, /Aucune/);
  }
});

test('restoration validates the corpus, rejects duplicate cards and strips private or excess fields', async () => {
  const storage = new Map([[storageKey, JSON.stringify({version: 1, astrology: completeAstrology(), result: 'PRIVATE_RESULT', journal: 'PRIVATE_JOURNAL', readings: [
    completeReading('valid', {question: '<img src=x onerror=alert(1)>', answers: {goal: 'x'.repeat(500), private: 'PRIVATE_ANSWER'}}),
    completeReading('bad-card', {cardIds: ['missing-9', 'major-1', 'major-2']}),
    completeReading('duplicate-card', {cardIds: ['major-1', 'major-1', 'major-2']}),
    completeReading('bad-spread', {spread: '__proto__'}),
    completeReading('valid')
  ]})]]);
  const page = await setup({storage});
  assert.equal(page.saved().readings.length, 1);
  assert.equal(page.saved().readings[0].drawId, 'valid');
  assert.equal(page.saved().readings[0].answers.goal.length, 180);
  assert.ok(!storage.get(storageKey).includes('PRIVATE_'));
  assert.ok(!storage.get(storageKey).includes('astrology'));
  const question = page.element('summary-readings').children[0].children[1];
  assert.equal(question.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(question.innerHTMLWrites.length, 0);
  assert.equal(page.posts.length, 0);
});

test('malformed or oversized cache content is discarded safely', async () => {
  for (const saved of ['not JSON', 'x'.repeat(23000), JSON.stringify({version: 2, readings: [completeReading('draw-1')]})]) {
    const page = await setup({storage: new Map([[storageKey, saved]])});
    assert.equal(page.saved().readings.length, 0);
    assert.equal(page.posts.length, 0);
  }
});

test('a removed draw stays removed through edits and reload until a new draw is completed', async () => {
  const page = await setup({reading: completeReading('draw-1')});
  await page.remove(0);
  assert.equal(page.saved().readings.length, 0);
  await page.setReading(completeReading('draw-1', {question: 'Une modification'}));
  assert.equal(page.saved().readings.length, 0);
  const reloaded = await setup({storage: page.storage, reading: completeReading('draw-1')});
  assert.equal(reloaded.saved().readings.length, 0);
  await reloaded.setReading(completeReading('draw-2'));
  assert.deepEqual(reloaded.saved().readings.map(value => value.drawId), ['draw-2']);
});

test('clearing retained draws leaves the private journal and birth form alone', async () => {
  const journal = JSON.stringify({journal: 'PRIVATE_DIARY'});
  const page = await setup({storage: new Map([['nowis-oracle-carnet-v1', journal]]), reading: completeReading('draw-1'), astrology: completeAstrology()});
  await page.setReading(completeReading('draw-2'));
  await page.clear();
  assert.equal(page.saved().readings.length, 0);
  assert.equal(page.storage.get('nowis-oracle-carnet-v1'), journal);
  assert.match(page.element('summary-astro-status').textContent, /seront prises en compte/);
  await page.consent(true);
  assert.equal(page.element('summary-request').disabled, false, 'astrology alone still permits a conclusion');
});

for (const change of ['birth data', 'forecast date', 'same source event', 'question', 'answers', 'new identical draw', 'removal', 'clear', 'consent']) {
  test(`a change to ${change} aborts and invalidates an in-flight conclusion`, async () => {
    const page = await setup({reading: completeReading('draw-1'), astrology: completeAstrology()});
    await page.consent(true);
    const pending = page.request(); const request = page.posts[0];
    if (change === 'birth data') await page.setAstrology(completeAstrology({birthTime: '15:30'}));
    if (change === 'forecast date') await page.setAstrology(completeAstrology({forecastDate: '2026-10-05'}));
    if (change === 'same source event') await page.window.fire('astro:changed');
    if (change === 'question') await page.setReading(completeReading('draw-1', {question: 'Une autre question'}));
    if (change === 'answers') await page.setReading(completeReading('draw-1', {answers: {situation: 'Une autre situation'}}));
    if (change === 'new identical draw') await page.setReading(completeReading('draw-2', {revealed: []}));
    if (change === 'removal') await page.remove(0);
    if (change === 'clear') await page.clear();
    if (change === 'consent') await page.consent(false);
    assert.equal(request.options.signal.aborted, true);
    assert.equal(page.element('summary-consent').checked, false);
    assert.equal(page.element('summary-result').hidden, true);
    await page.finish(request, 'STALE_CONCLUSION'); await pending;
    assert.equal(page.element('summary-result').hidden, true);
    assert.equal(page.element('summary-result').children.length, 0);
  });
}

test('changing and restoring identical input cannot replace the newer answer with an older late response', async () => {
  const page = await setup({reading: completeReading('draw-1'), astrology: completeAstrology()});
  await page.consent(true);
  const oldPending = page.request(); const old = page.posts[0];
  await page.setAstrology(completeAstrology({forecastDate: '2026-10-05'}));
  await page.setAstrology(completeAstrology());
  await page.consent(true);
  const currentPending = page.request();
  await page.finish(page.posts[1], 'CURRENT_CONCLUSION'); await currentPending;
  await page.finish(old, 'STALE_CONCLUSION'); await oldPending;
  assert.deepEqual(page.element('summary-result').children.map(child => child.textContent), ['CURRENT_CONCLUSION']);
});

test('a response arriving after timeout remains invisible even if the transport ignores abort', async () => {
  const page = await setup({reading: completeReading('draw-1')});
  await page.consent(true);
  const pending = page.request(); const request = page.posts[0];
  assert.equal(page.timers.size, 1);
  for (const callback of page.timers.values()) callback();
  assert.equal(request.options.signal.aborted, true);
  await page.finish(request, 'TOO_LATE'); await pending;
  assert.equal(page.element('summary-result').hidden, true);
  assert.equal(page.element('summary-result').children.length, 0);
});

test('AI text is rendered only as plain paragraphs and bounded to 11000 characters and 800 words', async () => {
  const page = await setup({reading: completeReading('draw-1')});
  await page.consent(true);
  let pending = page.request();
  const html = '<img src=x onerror=alert(1)>\n<script>evil()</script>\nUne piste.';
  await page.finish(page.posts[0], html); await pending;
  const result = page.element('summary-result');
  assert.deepEqual(result.children.map(child => child.textContent), html.split('\n'));
  assert.equal(result.innerHTMLWrites.length, 0);
  assert.ok(result.children.every(child => child.innerHTMLWrites.length === 0));
  pending = page.request();
  await page.finish(page.posts[1], Array.from({length: 1200}, (_, index) => `mot${index}`).join(' ')); await pending;
  let rendered = result.children.map(child => child.textContent).join('\n');
  assert.equal(rendered.split(/\s+/).length, 800);
  pending = page.request();
  await page.finish(page.posts[2], 'a'.repeat(12000)); await pending;
  rendered = result.children.map(child => child.textContent).join('\n');
  assert.equal(rendered.length, 11000);
});

test('rate limits and invalid requests produce a French explanation without fabricating a conclusion', async () => {
  for (const status of [429, 400, 503]) {
    const page = await setup({reading: completeReading('draw-1')});
    await page.consent(true); const pending = page.request();
    await page.finish(page.posts[0], 'NOT_A_VALID_CONCLUSION', status, 'unavailable'); await pending;
    assert.equal(page.element('summary-result').hidden, true);
    assert.equal(page.element('summary-request').disabled, false);
    assert.match(page.element('summary-status').textContent, status === 429 ? /récemment/ : status === 400 ? /Vérifiez/ : /indisponible/);
  }
});

test('provider errors explain the failure, preserve readings and allow a retry without exposing server details', async () => {
  for (const [reason, expected] of [['timeout', /trop de temps/], ['incomplete', /pas terminé/], ['auth', /indisponible/], ['quota', /limite temporaire/], ['http', /pas pu répondre/], ['output_limit', /adaptée/], ['refusal', /cette demande/], ['empty', /utilisable/], ['unknown-private-value', /indisponible/]]) {
    const page = await setup({reading: completeReading('draw-1')});
    await page.consent(true); const pending = page.request();
    page.posts[0].resolve(response({mode: 'unavailable', reason, message: 'PRIVATE_SERVER_DETAIL', reply: 'NOT_A_CONCLUSION'}, 503));
    await pending;
    assert.match(page.element('summary-status').textContent, expected);
    assert.equal(page.element('summary-status').textContent.includes('PRIVATE_SERVER_DETAIL'), false);
    assert.equal(page.element('summary-result').hidden, true);
    assert.equal(page.element('summary-request').disabled, false);
    assert.equal(page.saved().readings[0].drawId, 'draw-1');
    const retry = page.request();
    await page.finish(page.posts[1], 'Une nouvelle conclusion symbolique.'); await retry;
    assert.equal(page.element('summary-result').hidden, false);
  }
});

test('network timeouts leave an understandable message and retain the selection for another attempt', async () => {
  const page = await setup({reading: completeReading('draw-1')});
  await page.consent(true); const pending = page.request();
  for (const callback of page.timers.values()) callback();
  page.posts[0].reject(new DOMException('PRIVATE_NETWORK_ERROR', 'AbortError'));
  await pending;
  assert.match(page.element('summary-status').textContent, /trop de temps/);
  assert.equal(page.element('summary-request').disabled, false);
  assert.equal(page.saved().readings.length, 1);
  assert.equal(page.element('summary-result').hidden, true);
});
