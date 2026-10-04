/* Run with: node --test scripts/tarot-oracle-client.test.cjs */
'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const readerDirectory = path.join(__dirname, '../public/tarot-reader');

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(type, [...listeners, listener]);
  }
  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) || []) listener(event);
    return true;
  }
  fire(type, properties = {}) {
    const event = { type, target: this, preventDefault() {}, ...properties };
    return Promise.all((this.listeners.get(type) || []).map(listener => listener(event)));
  }
}

class Element extends Target {
  constructor(id, tagName = 'DIV') {
    super();
    Object.assign(this, {
      id, tagName, value: '', checked: false, disabled: false, hidden: false,
      open: false, textContent: '', children: [], dataset: {}, attributes: new Map(),
      innerHTMLWrites: [], style: { setProperty() {} }, focused: false,
    });
  }
  set innerHTML(value) { this.innerHTMLWrites.push(value); this.html = value; }
  get innerHTML() { return this.html || ''; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  replaceChildren(...children) { this.children = children; }
  focus() { this.focused = true; }
  scrollIntoView() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  querySelector(selector) {
    // The real app renders cards into this element; only their click/focus targets
    // are needed here. Parsing/simulating arbitrary HTML would hide XSS mistakes.
    const index = Number(selector.match(/data-index="(\d+)"/)?.[1] || 0);
    if (this.id === 'card-table') {
      const button = new Element(`card-${index}`, 'BUTTON');
      button.dataset.index = String(index);
      return button;
    }
    throw new Error(`Unexpected element selector: ${selector}`);
  }
  closest(selector) { return selector === '[data-index]' && 'index' in this.dataset ? this : null; }
}

const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };
const plain = value => JSON.parse(JSON.stringify(value));

async function setup({ available = true, repeatedDraw = false } = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };
  element('deck').value = 'all';
  element('oracle-ai-controls').hidden = true;
  element('oracle-ai-result').hidden = true;
  const spreads = [2, 3, 4, 5].map(count => {
    const button = new Element(`spread-${count}`, 'BUTTON');
    button.dataset.spread = String(count);
    return button;
  });
  const intentions = ['clarte', 'elan', 'apaisement'].map(value => {
    const radio = new Element(`intention-${value}`, 'INPUT');
    radio.value = value;
    return radio;
  });
  const window = new Target();
  const document = {
    getElementById: element,
    createElement: tagName => new Element('', tagName.toUpperCase()),
    querySelectorAll: selector => {
      if (selector === '[data-spread]') return spreads;
      if (selector === '[name="oracle-intention"]') return intentions;
      throw new Error(`Unexpected selector collection: ${selector}`);
    },
    querySelector: selector => {
      if (selector === '.brand') return element('brand');
      const count = selector.match(/^\[data-spread="(\d+)"\]$/)?.[1];
      if (count) return spreads.find(button => button.dataset.spread === count);
      throw new Error(`Unexpected document selector: ${selector}`);
    },
  };
  const storage = new Map();
  const calls = [];
  const posts = [];
  const timers = new Map();
  let timerId = 0;
  const context = vm.createContext({
    window, document, console, Event, AbortController,
    crypto: repeatedDraw ? { getRandomValues: array => array.fill(0) } : webcrypto,
    Uint32Array, matchMedia: () => ({ matches: false }), navigator: {},
    location: { hash: '', pathname: '/tarot-reader/index.html', search: '', href: 'https://nowis.store/tarot-reader/index.html' },
    history: { state: null, replaceState(state) { this.state = state; } },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    setTimeout: callback => { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: (url, options = {}) => {
      const call = { url, options };
      calls.push(call);
      if (options.method !== 'POST') return Promise.resolve(response({ available }));
      // Deliberately ignore AbortSignal: late responses from already cancelled
      // requests must be harmless even when a transport does not stop promptly.
      return new Promise((resolve, reject) => posts.push({ ...call, resolve, reject }));
    },
  });
  for (const file of ['tarot-data.js', 'tarot-personalization.js', 'tarot-reading.js', 'app.js', 'oracle.js']) {
    vm.runInContext(fs.readFileSync(path.join(readerDirectory, file), 'utf8'), context, { filename: file });
  }
  await flush();

  const input = async (id, value, type = 'input') => { element(id).value = value; await element(id).fire(type); };
  const consent = async checked => { element('oracle-ai-consent').checked = checked; await element('oracle-ai-consent').fire('change'); };
  const selectIntention = async value => {
    const radio = intentions.find(candidate => candidate.value === value);
    intentions.forEach(candidate => { candidate.checked = candidate === radio; });
    await radio.fire('change');
  };
  const drawAndReveal = async () => { await element('draw').fire('click'); await element('reveal-all').fire('click'); };
  return { element, spreads, calls, posts, storage, timers, window, input, consent, selectIntention, drawAndReveal,
    reading: () => plain(window.TAROT_SESSION.getReading()),
    request: () => element('oracle-ai-request').fire('click'),
    finish: async (request, reply = 'Lecture symbolique.', status = 200) => { request.resolve(response({ mode: 'ai', reply }, status)); await flush(); },
  };
}

test('no AI POST without availability, consent and a fully revealed nonempty draw', async () => {
  const page = await setup();
  assert.equal(page.calls.length, 1, 'initial capability GET only');
  assert.equal(page.calls[0].url, '/api/tarot/oracle');
  assert.equal(page.calls[0].options.cache, 'no-store');
  await page.request();
  await page.consent(true);
  await page.request();
  assert.equal(page.posts.length, 0, 'consent cannot authorize an empty draw');
  await page.element('draw').fire('click');
  await page.consent(true);
  await page.request();
  assert.equal(page.posts.length, 0, 'face-down cards are not sent');
  await page.element('card-table').fire('click', { target: Object.assign(new Element('card', 'BUTTON'), { dataset: { index: '0' } }) });
  await page.request();
  assert.equal(page.posts.length, 0, 'a partially revealed draw is not sent');
  await page.element('reveal-all').fire('click');
  await page.consent(false);
  await page.request();
  assert.equal(page.posts.length, 0, 'fully revealed cards still require consent');

  const offline = await setup({ available: false });
  await offline.drawAndReveal();
  await offline.consent(true);
  await offline.request();
  assert.equal(offline.posts.length, 0);
  assert.equal(offline.element('oracle-ai-controls').hidden, true);
});

test('exact snapshot payload preserves card order/spread positions and never sends the private journal', async () => {
  const page = await setup();
  await page.input('question', '  Comment avancer dans mon projet ?  ');
  await page.input('context-situation', '  Je prépare une exposition  ');
  await page.input('context-goal', 'Créer un premier projet');
  await page.input('context-feeling', 'motive', 'change');
  await page.input('context-blocker', 'informations', 'change');
  await page.selectIntention('elan');
  await page.input('oracle-journal', 'PRIVATE_DIARY_SECRET_<script>alert(1)</script>');
  await page.spreads.find(button => button.dataset.spread === '4').fire('click');
  await page.drawAndReveal();
  const snapshot = page.reading();
  await page.consent(true);
  const pending = page.request();
  assert.equal(page.posts.length, 1);
  const request = page.posts[0];
  assert.equal(request.url, '/api/tarot/oracle');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.cache, 'no-store');
  assert.deepEqual(plain(request.options.headers), { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(request.options.body), {
    consent: true,
    question: 'Comment avancer dans mon projet ?',
    spread: '4',
    cardIds: snapshot.cardIds,
    answers: { situation: 'Je prépare une exposition', goal: 'Créer un premier projet', feeling: 'motive', blocker: 'informations' },
    intention: 'elan',
  });
  assert.equal(snapshot.cardIds.length, 4);
  assert.equal(new Set(snapshot.cardIds).size, 4);
  assert.deepEqual(snapshot.revealed, [0, 1, 2, 3], 'original order determines each server-side spread position');
  assert.ok(!request.options.body.includes('PRIVATE_DIARY_SECRET'));
  assert.equal(page.element('oracle-ai-request').disabled, true, 'busy state disables another request');
  await page.request();
  assert.equal(page.posts.length, 1, 'even a direct extra click cannot duplicate a request');
  await page.finish(request);
  await pending;
  assert.equal(page.element('oracle-ai-result').hidden, false);
  assert.equal(page.element('oracle-ai-request').disabled, false);
});

test('changing and restoring the same question cannot resurrect an older cancelled answer', async () => {
  const page = await setup();
  await page.input('question', 'Ma question initiale');
  await page.drawAndReveal();
  await page.consent(true);
  const oldPending = page.request();
  const oldRequest = page.posts[0];
  await page.input('question', 'Une nouvelle question');
  assert.equal(oldRequest.options.signal.aborted, true);
  assert.equal(page.element('oracle-ai-consent').checked, false);
  assert.equal(page.element('oracle-ai-result').hidden, true);
  await page.input('question', 'Ma question initiale');
  await page.consent(true);
  const currentPending = page.request();
  await page.finish(page.posts[1], 'CURRENT_ANSWER');
  await currentPending;
  await page.finish(oldRequest, 'STALE_ANSWER');
  await oldPending;
  assert.deepEqual(page.element('oracle-ai-result').children.map(child => child.textContent), ['CURRENT_ANSWER']);
  assert.equal(page.element('oracle-ai-result').hidden, false);
});

test('new draw clears the answer, revokes consent and ignores the previous transport response', async () => {
  const page = await setup();
  await page.drawAndReveal();
  await page.consent(true);
  const pending = page.request();
  const request = page.posts[0];
  await page.element('draw').fire('click');
  assert.equal(request.options.signal.aborted, true);
  assert.equal(page.element('oracle-ai-consent').checked, false);
  assert.equal(page.element('oracle-vision').hidden, true);
  await page.finish(request, 'OLD_DRAW_ANSWER');
  await pending;
  assert.equal(page.element('oracle-ai-result').hidden, true);
  assert.equal(page.element('oracle-ai-result').children.length, 0);
  await page.request();
  assert.equal(page.posts.length, 1);
});

test('even a new draw with exactly the same card IDs invalidates the previous request', async () => {
  const page = await setup({ repeatedDraw: true });
  await page.drawAndReveal();
  const previousCards = page.reading().cardIds;
  await page.consent(true);
  const pending = page.request();
  const request = page.posts[0];
  await page.element('draw').fire('click');
  assert.deepEqual(page.reading().cardIds, previousCards, 'rare but valid identical next draw is forced here');
  assert.equal(request.options.signal.aborted, true);
  assert.equal(page.element('oracle-ai-consent').checked, false);
  await page.element('reveal-all').fire('click');
  await page.finish(request, 'OLD_IDENTICAL_DRAW_ANSWER');
  await pending;
  assert.equal(page.element('oracle-ai-result').hidden, true);
  assert.equal(page.element('oracle-ai-result').children.length, 0);
});

test('a reply arriving after timeout is ignored even if the transport ignores AbortSignal', async () => {
  const page = await setup();
  await page.drawAndReveal();
  await page.consent(true);
  const pending = page.request();
  const request = page.posts[0];
  assert.equal(page.timers.size, 1, 'only the in-flight request timeout remains');
  for (const callback of page.timers.values()) callback();
  assert.equal(request.options.signal.aborted, true);
  await page.finish(request, 'ANSWER_AFTER_TIMEOUT');
  await pending;
  assert.equal(page.element('oracle-ai-result').hidden, true);
  assert.equal(page.element('oracle-ai-result').children.length, 0);
});

for (const change of ['consent', 'answers', 'intention', 'spread']) {
  test(`a change to ${change} aborts and invalidates an in-flight vision`, async () => {
    const page = await setup();
    await page.drawAndReveal();
    await page.consent(true);
    const pending = page.request();
    const request = page.posts[0];
    if (change === 'consent') await page.consent(false);
    if (change === 'answers') await page.input('context-situation', 'Une situation différente');
    if (change === 'intention') await page.selectIntention('apaisement');
    if (change === 'spread') await page.spreads.find(button => button.dataset.spread === '2').fire('click');
    assert.equal(request.options.signal.aborted, true);
    assert.equal(page.element('oracle-ai-consent').checked, false);
    await page.finish(request, 'STALE_RESPONSE');
    await pending;
    assert.equal(page.element('oracle-ai-result').hidden, true);
    assert.equal(page.element('oracle-ai-result').children.length, 0);
  });
}

test('AI text containing HTML is rendered only via textContent, never through innerHTML', async () => {
  const page = await setup();
  await page.drawAndReveal();
  await page.consent(true);
  const pending = page.request();
  const reply = '<img src=x onerror="alert(1)">\n<script>globalThis.compromised = true</script>\nUne piste symbolique.';
  await page.finish(page.posts[0], reply);
  await pending;
  const result = page.element('oracle-ai-result');
  assert.equal(result.hidden, false);
  assert.deepEqual(result.children.map(child => child.tagName), ['P', 'P', 'P']);
  assert.deepEqual(result.children.map(child => child.textContent), reply.split('\n'));
  assert.equal(result.innerHTMLWrites.length, 0);
  assert.ok(result.children.every(child => child.innerHTMLWrites.length === 0 && child.children.length === 0));
});

test('failed AI response keeps the local reading and never exposes a supplied reply', async () => {
  const page = await setup();
  await page.drawAndReveal();
  await page.consent(true);
  const pending = page.request();
  await page.finish(page.posts[0], 'MUST_NOT_BE_DISPLAYED', 429);
  await pending;
  assert.equal(page.element('oracle-ai-result').hidden, true);
  assert.equal(page.element('oracle-vision').hidden, false);
  assert.equal(page.element('interpretations').hidden, false);
  assert.match(page.element('oracle-ai-status').textContent, /Plusieurs visions/);
  assert.equal(page.element('oracle-ai-request').disabled, false);
});
