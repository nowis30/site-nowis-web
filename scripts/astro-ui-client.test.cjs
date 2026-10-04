'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const directory = path.join(__dirname, '../public/tarot-reader');
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) || []), fn]); }
  dispatchEvent(event) { for (const fn of this.listeners.get(event.type) || []) fn(event); return true; }
  fire(type, properties = {}) {
    const event = { type, target: this, preventDefault() {}, ...properties };
    return Promise.all((this.listeners.get(type) || []).map(fn => fn(event)));
  }
}

class Element extends Target {
  constructor(id, tag) {
    super();
    Object.assign(this, { id, value: /\bvalue="([^"]*)"/.exec(tag)?.[1] || '', checked: /\bchecked(?:\s|>)/.test(tag), hidden: /\bhidden(?:\s|>)/.test(tag), disabled: /\bdisabled(?:\s|>)/.test(tag), required: /\brequired(?:\s|>)/.test(tag), min: /\bmin="([^"]*)"/.exec(tag)?.[1], max: /\bmax="([^"]*)"/.exec(tag)?.[1], focused: false, html: '', text: '' });
    this.initialValue = this.value;
    this.initialChecked = this.checked;
  }
  set innerHTML(value) {
    this.html = String(value); this.text = '';
    if (/^\s*<option\b/.test(value)) this.value = /<option\b[^>]*value="([^"]*)"/.exec(value)?.[1] || '';
  }
  get innerHTML() { return this.html; }
  set textContent(value) { this.text = String(value); this.html = ''; }
  get textContent() { return this.text; }
  focus() { this.focused = true; }
  scrollIntoView() {}
  replaceChildren() { this.html = ''; this.text = ''; }
  querySelector(selector) {
    if (this.id === 'astro-result' && selector === 'a[href="#summary-section"]') return this.summaryLink;
    throw new Error(`Unsupported fixture selector ${selector}`);
  }
}

const manifest = { countries: [{ code: 'CA', name: 'Canada', url: '/tarot-reader/astro-places/CA.json' }, { code: 'FR', name: 'France', url: '/tarot-reader/astro-places/FR.json' }], timeZones: ['America/Toronto', 'Europe/Paris', 'UTC'] };
const places = [{ id: '6077243', name: 'Montréal', aliases: ['Montreal'], region: 'Québec', latitude: 45.5019, longitude: -73.5674, timeZone: 'America/Toronto' }];

async function boot(options = {}) {
  const elements = new Map();
  for (const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)) elements.set(match[1], new Element(match[1], match[0]));
  const get = id => { assert.ok(elements.has(id), `Missing real HTML element ${id}`); return elements.get(id); };
  get('astro-result').summaryLink = new Element('astro-summary-link', '<a href="#summary-section">');
  get('astro-form').reset = () => { for (const element of elements.values()) { element.value = element.initialValue; element.checked = element.initialChecked; } };
  const requests = [];
  const windowTarget = new Target();
  const context = vm.createContext({ Date, Intl, console, Event: class { constructor(type) { this.type = type; } }, document: { getElementById: id => elements.get(id) || null }, matchMedia: () => ({ matches: true }), fetch: async (url, requestOptions) => {
    requests.push({ url, options: requestOptions });
    const custom = options.fetch && await options.fetch(url, requestOptions);
    if (custom) return custom;
    return { ok: true, json: async () => url.endsWith('manifest.json') ? manifest : places };
  }, localStorage: { getItem() { throw new Error('Birth information must not use persistent storage'); }, setItem() { throw new Error('Birth information must not use persistent storage'); } }, sessionStorage: { getItem() { throw new Error('No session storage for birth information'); }, setItem() { throw new Error('No session storage for birth information'); } } });
  context.window = context;
  context.addEventListener = windowTarget.addEventListener.bind(windowTarget);
  context.dispatchEvent = windowTarget.dispatchEvent.bind(windowTarget);
  for (const file of ['vendor/astronomy.browser.min.js', 'astro-engine.js', 'astro-meanings.js', 'astro-ui.js']) vm.runInContext(fs.readFileSync(path.join(directory, file), 'utf8'), context, { filename: file });
  await flush();
  return { context, get, elements, requests, windowTarget, async input(id, value) { const element = get(id); if (typeof value === 'boolean') element.checked = value; else element.value = value; await get('astro-form').fire('input', { target: element }); await get('astro-form').fire('change', { target: element }); }, async submit() { await get('astro-form').fire('submit'); } };
}

function flush() { return new Promise(resolve => setImmediate(resolve)); }
async function manual(harness, overrides = {}) {
  await harness.input('astro-use-custom', true);
  harness.get('astro-custom-name').value = 'Lieu de démonstration';
  harness.get('astro-latitude').value = String(overrides.latitude ?? 45.5019);
  harness.get('astro-longitude').value = String(overrides.longitude ?? -73.5674);
  harness.get('astro-time-zone').value = overrides.timeZone || 'America/Toronto';
  harness.get('astro-birth-date').value = overrides.birthDate || '2000-01-01';
  harness.get('astro-birth-time').value = overrides.birthTime || '12:00';
  harness.get('astro-forecast-date').value = overrides.forecastDate || '2026-10-04';
}

test('real deferred script order supplies the actual Astronomy/browser globals before the UI', async () => {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(match => ({ name: match[1], tag: match[0] }));
  const required = ['vendor/astronomy.browser.min.js', 'astro-engine.js', 'astro-meanings.js', 'astro-ui.js', 'oracle-summary.js'];
  let previous = -1;
  for (const name of required) {
    const index = scripts.findIndex(script => script.name === name);
    assert.ok(index > previous, `${name} must load in dependency order`);
    assert.match(scripts[index].tag, /\bdefer\b/);
    previous = index;
  }
  const harness = await boot();
  assert.equal(typeof harness.context.Astronomy.GeoVector, 'function');
  assert.equal(typeof harness.context.ASTRO_ENGINE.calculate, 'function');
  assert.equal(harness.context.ASTRO_MEANINGS.signs.length, 12);
  await manual(harness);
  await harness.submit();
  assert.equal(harness.get('astro-result').hidden, false);
  assert.equal(harness.context.ASTRO_SESSION.getContext().birthDate, '2000-01-01');
  assert.match(harness.get('astro-key-meanings').innerHTML, /Soleil|Lune/);
  assert.match(harness.get('astro-chart').innerHTML, /<svg/);
});

test('unknown time displays uncertainty, possible signs and no ascendant or house interpretation', async () => {
  const harness = await boot();
  await manual(harness, { birthDate: '2024-03-20', timeZone: 'UTC' });
  await harness.input('astro-unknown-time', true);
  assert.equal(harness.get('astro-birth-time').disabled, true);
  assert.equal(harness.get('astro-birth-time').required, false);
  await harness.submit();
  assert.equal(harness.get('astro-result').hidden, false);
  assert.match(harness.get('astro-key-meanings').innerHTML, /Poissons et Bélier/);
  assert.match(harness.get('astro-key-meanings').innerHTML, /Ascendant non calculé/);
  assert.match(harness.get('astro-key-meanings').innerHTML, /Position indicative à midi/);
  assert.doesNotMatch(harness.get('astro-key-meanings').innerHTML, /Maison \d/);
  assert.doesNotMatch(harness.get('astro-transits').innerHTML, /Lune de naissance|Ascendant de naissance|Milieu du ciel de naissance/);
  assert.match(harness.get('astro-elements').innerHTML, /positions trop incertaines sont écartées/);
  assert.match(harness.get('astro-elements').innerHTML, /repères stables/);
});

test('ambiguous birth time offers two occurrences and waits for an explicit choice', async () => {
  const harness = await boot();
  await manual(harness, { birthDate: '2024-11-03', birthTime: '01:30' });
  await harness.submit();
  assert.equal(harness.get('astro-result').hidden, true);
  assert.equal(harness.context.ASTRO_SESSION.getContext(), null);
  assert.equal(harness.get('astro-time-choice').hidden, false);
  assert.match(harness.get('astro-disambiguation').innerHTML, /value="earlier"/);
  assert.match(harness.get('astro-disambiguation').innerHTML, /value="later"/);
  await harness.input('astro-disambiguation', 'later');
  await harness.submit();
  assert.equal(harness.get('astro-result').hidden, false);
  assert.equal(harness.context.ASTRO_SESSION.getContext().disambiguation, 'later');
  await harness.input('astro-birth-time', '02:30');
  assert.equal(harness.get('astro-time-choice').hidden, true);
  assert.equal(harness.get('astro-disambiguation').value, '');
});

test('a spring clock gap gives a clear error and no stale or invented birth chart', async () => {
  const harness = await boot();
  await manual(harness);
  await harness.submit();
  await harness.input('astro-birth-date', '2024-03-10');
  await harness.input('astro-birth-time', '02:30');
  await harness.submit();
  assert.equal(harness.context.ASTRO_SESSION.getContext(), null);
  assert.equal(harness.get('astro-result').hidden, true);
  assert.match(harness.get('astro-status').textContent, /n’existait pas/);
});

test('changing any birth/forecast input invalidates the result and downstream AI context', async () => {
  const harness = await boot();
  const changes = [];
  harness.windowTarget.addEventListener('astro:changed', () => changes.push(harness.context.ASTRO_SESSION.getContext()));
  await manual(harness);
  await harness.submit();
  const copy = harness.context.ASTRO_SESSION.getContext();
  copy.birthDate = '1900-01-01';
  assert.equal(harness.context.ASTRO_SESSION.getContext().birthDate, '2000-01-01');
  await harness.input('astro-forecast-date', '2026-10-05');
  assert.equal(harness.context.ASTRO_SESSION.getContext(), null);
  assert.equal(harness.get('astro-result').hidden, true);
  assert.equal(changes[changes.length - 1], null);
});

test('city search stays local, handles accents and cannot select stale results after edits', async () => {
  let resolveCountry;
  const countryPromise = new Promise(resolve => { resolveCountry = resolve; });
  const harness = await boot({ fetch: async url => url.endsWith('/CA.json') ? countryPromise : null });
  harness.get('astro-city-query').value = 'Montreal';
  const search = harness.get('astro-search-place').fire('click');
  await flush();
  await harness.input('astro-city-query', 'Québec');
  resolveCountry({ ok: true, json: async () => places });
  await search;
  assert.equal(harness.get('astro-place-results').hidden, true);
  assert.doesNotMatch(harness.get('astro-place-select').innerHTML, /6077243/);
  await harness.input('astro-city-query', 'Montreal');
  await harness.get('astro-search-place').fire('click');
  assert.match(harness.get('astro-place-select').innerHTML, /Montréal/);
  await harness.input('astro-place-select', '6077243');
  harness.get('astro-birth-date').value = '2000-01-01';
  harness.get('astro-birth-time').value = '12:00';
  harness.get('astro-forecast-date').value = '2026-10-04';
  await harness.submit();
  assert.equal(harness.context.ASTRO_SESSION.getContext().timeZone, 'America/Toronto');
  assert.ok(harness.requests.every(request => request.url.startsWith('/tarot-reader/astro-places/') && !request.url.includes('?')));
  assert.ok(harness.requests.every(request => !request.options?.body));
});

test('manual coordinates are inactive when unchecked and the custom name remains optional', async () => {
  const harness = await boot();
  await manual(harness);
  assert.equal(harness.get('astro-custom-name').required, false);
  for (const id of ['astro-latitude', 'astro-longitude', 'astro-time-zone']) {
    assert.equal(harness.get(id).disabled, false);
    assert.equal(harness.get(id).required, true);
  }
  harness.get('astro-latitude').value = '999';
  await harness.input('astro-use-custom', false);
  for (const id of ['astro-latitude', 'astro-longitude', 'astro-time-zone']) {
    assert.equal(harness.get(id).disabled, true, `${id} must not block native constraint validation for a selected city`);
    assert.equal(harness.get(id).required, false);
  }
});

test('clear birth information removes biography/results from the hidden DOM and session', async () => {
  const harness = await boot();
  await manual(harness);
  await harness.submit();
  assert.match(harness.get('astro-result-context').textContent, /01\/01\/2000/);
  await harness.get('astro-clear').fire('click');
  assert.equal(harness.context.ASTRO_SESSION.getContext(), null);
  assert.equal(harness.get('astro-birth-date').value, '');
  assert.equal(harness.get('astro-birth-time').value, '');
  assert.equal(harness.get('astro-result').hidden, true);
  assert.equal(harness.get('astro-result-context').textContent, '');
  for (const id of ['astro-chart', 'astro-key-meanings', 'astro-planet-meanings', 'astro-elements', 'astro-natal-aspects', 'astro-transits', 'astro-forecast-positions', 'astro-warnings']) assert.equal(harness.get(id).innerHTML, '', `${id} must be cleared rather than merely hidden`);
  assert.match(harness.get('astro-status').textContent, /effacées/);
  assert.ok(harness.requests.every(request => request.url.startsWith('/tarot-reader/astro-places/')));
});

test('personal text is safely rendered and astro UI sends no biography during local calculation', async () => {
  const harness = await boot();
  await manual(harness);
  const supplied = '<img src=x onerror=alert(1)>';
  harness.get('astro-custom-name').value = supplied;
  await harness.submit();
  assert.equal(harness.get('astro-result').hidden, false);
  assert.ok(harness.get('astro-result-context').textContent.startsWith(supplied));
  assert.equal(harness.get('astro-result-context').innerHTML, '');
  assert.ok(harness.requests.every(request => request.url.startsWith('/tarot-reader/astro-places/')));
});

test('place-data load failure still allows a private calculation from explicit coordinates', async () => {
  const harness = await boot({ fetch: async () => ({ ok: false }) });
  assert.match(harness.get('astro-place-status').textContent, /pas pu être chargée/);
  await manual(harness);
  await harness.submit();
  assert.equal(harness.get('astro-result').hidden, false);
  assert.equal(harness.context.ASTRO_SESSION.getContext().latitude, 45.5019);
  assert.ok(harness.requests.every(request => request.url.startsWith('/tarot-reader/astro-places/')));
});
