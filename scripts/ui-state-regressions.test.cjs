const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Run the actual components and hooks with deterministic commit/effect lifecycles.
// Responses are deliberately controllable to exercise races without any network.
function createRuntime({ server = false, storage = new Map(), audio = null } = {}) {
  const slots = [], requests = [], timers = new Map();
  let cursor = 0, dirty = false, pending = [], target, props, tree, writes = 0;
  const events = new EventTarget();
  const documentEvents = new EventTarget();
  const window = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    setTimeout: callback => { const id = timers.size + 1; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
    innerWidth: 390,
    location: { pathname: '/radio' },
  };
  const document = {
    addEventListener: documentEvents.addEventListener.bind(documentEvents),
    removeEventListener: documentEvents.removeEventListener.bind(documentEvents),
    body: { style: {}, classList: { toggle() {}, remove() {} } },
    documentElement: { style: { setProperty() {}, removeProperty() {} } },
    querySelector: () => null, visibilityState: 'visible',
  };
  const same = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { kind: 'state', value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; writes++; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return (slots[index] ??= { kind: 'ref', value: { current: initial } }).value;
    },
    useMemo(callback, dependencies) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].dependencies, dependencies)) {
        slots[index] = { kind: 'memo', value: callback(), dependencies };
      }
      return slots[index].value;
    },
    useCallback(callback, dependencies) { return react.useMemo(() => callback, dependencies); },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (api.server) return;
      slots[index] ??= { kind: 'effect' };
      if (!same(slots[index].dependencies, dependencies)) pending.push({ index, callback, dependencies });
    },
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      const index = cursor++;
      slots[index] ??= { kind: 'external' };
      if (!api.server && !slots[index].cleanup) pending.push({ index, subscribe });
      return api.server ? getServerSnapshot() : getSnapshot();
    },
    useTransition: () => [false, callback => callback()],
    createContext: () => ({ Provider: 'context-provider' }),
    useContext: () => null,
  };
  const fetch = (url, options = {}) => new Promise(resolve => {
    requests.push({ url, options, respond: (status, body) => resolve({ ok: status < 400, status, json: async () => body }) });
  });
  const api = {
    react, window, document, storage, requests, timers, fetch, server,
    get writes() { return writes; },
    render(component = target, nextProps = props) {
      target = component; props = nextProps;
      let attempts = 0;
      do {
        assert.ok(attempts++ < 25, 'State adjustments must converge');
        cursor = 0; dirty = false; pending = [];
        tree = target(props);
      } while (dirty);
      if (audio) {
        const element = find(tree, node => node.type === 'audio');
        if (element) element.props.ref.current = audio;
      }
      for (const entry of pending) {
        slots[entry.index].cleanup?.();
        if (entry.subscribe) slots[entry.index].cleanup = entry.subscribe(() => { dirty = true; });
        else {
          slots[entry.index].dependencies = entry.dependencies;
          slots[entry.index].cleanup = entry.callback();
        }
      }
      return tree;
    },
    async flush() {
      for (let count = 0; count < 12; count++) {
        await Promise.resolve();
        if (dirty) api.render();
      }
      return tree;
    },
    unmount() { for (const slot of slots) slot.cleanup?.(); },
    load(file, bindings = {}) {
      const module = { exports: {} };
      const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
      } }).outputText;
      vm.runInNewContext(code, {
        module, exports: module.exports, fetch, window, document, Event, Date, Intl, AbortController,
        URL, URLSearchParams, TextEncoder, DOMException, console, setTimeout, clearTimeout,
        sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        require(name) {
          if (name === 'react') return react;
          if (name === 'react/jsx-runtime') return require(name);
          if (name in bindings) return bindings[name];
          if (name === 'next/link') return { __esModule: true, default: 'a' };
          if (name === 'next/image') return { __esModule: true, default: 'img' };
          if (name === 'lucide-react') return new Proxy({}, { get: () => 'svg' });
          throw new Error('Unexpected component dependency: ' + name);
        },
      }, { filename: file });
      return module.exports;
    },
  };
  return api;
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function text(node) {
  return typeof node === 'string' || typeof node === 'number' ? String(node)
    : Array.isArray(node) ? node.map(text).join(' ') : node?.props ? text(node.props.children) : '';
}
function button(tree, label) { return find(tree, node => node.type === 'button' && text(node).trim() === label); }

test('CRUD search rejects late results, preserves reload promises and does not publish after unmount', async () => {
  const ui = createRuntime();
  const { useCrudResourceWithParams } = ui.load('src/features/crm/hooks/useCrudResource.ts');
  const renderHook = props => useCrudResourceWithParams('/api/crm/contacts', props.search, props.params);
  const oldHook = ui.render(renderHook, { search: 'old', params: { view: 'active' } });
  assert.equal(oldHook.loading, true);
  ui.render(renderHook, { search: 'new', params: { view: 'active' } });
  assert.equal(ui.requests.length, 2);
  ui.requests[1].respond(200, { items: [{ id: 'new' }] });
  assert.equal((await ui.flush()).items[0].id, 'new');
  await oldHook.reload();
  assert.equal(ui.requests.length, 2, 'A completed action from a previous query must not reload the old filter');
  ui.requests[0].respond(200, { items: [{ id: 'old' }] });
  assert.equal((await ui.flush()).items[0].id, 'new');
  ui.render(renderHook, { search: 'new', params: { view: 'active' } });
  assert.equal(ui.requests.length, 2, 'Equivalent filter objects must not refetch forever');
  let hook = ui.render();
  const reload = hook.reload();
  hook = ui.render();
  assert.equal(hook.loading, true);
  ui.requests[2].respond(200, { items: [{ id: 'reload' }] });
  await reload;
  assert.equal((await ui.flush()).items[0].id, 'reload');
  const lateReload = ui.render().reload();
  ui.render(); ui.unmount();
  const writes = ui.writes;
  ui.requests[3].respond(200, { items: [{ id: 'unmounted' }] });
  await lateReload;
  assert.equal(ui.writes, writes);
});

test('CRUD loading and failures follow the current query instead of previous errors', async () => {
  const ui = createRuntime();
  const { useCrudResource } = ui.load('src/features/crm/hooks/useCrudResource.ts');
  const renderHook = search => useCrudResource('/api/crm/contacts', search);
  ui.render(renderHook, 'bad');
  ui.requests[0].respond(503, { error: 'Indisponible' });
  assert.equal((await ui.flush()).error, 'Indisponible');
  const changed = ui.render(renderHook, 'fixed');
  assert.equal(changed.loading, true); assert.equal(changed.error, null);
  ui.requests[1].respond(200, { items: [{ id: 'fixed' }] });
  assert.equal((await ui.flush()).loading, false);
  const anotherFilter = ui.render(renderHook, 'another');
  assert.equal(anotherFilter.items.length, 0, 'Rows from a different filter must not be exposed during loading');
  assert.equal(anotherFilter.loading, true);
  ui.requests[2].respond(200, { items: [] });
  await ui.flush();
  ui.unmount();
});

test('contact tabs reset from URL changes and do not restore stale local selection on history return', () => {
  const ui = createRuntime(); let search = '?tab=summary';
  const panels = ['ContactSummary', 'ContactTimeline', 'ContactTasks', 'ContactAppointments', 'ContactInvoices',
    'ContactFilesPanel', 'ContactEmails', 'ContactActionModal', 'ContactSongRequests', 'ContactEditModal'];
  const bindings = {
    'next/navigation': { useSearchParams: () => new URLSearchParams(search), useRouter: () => ({ push() {}, refresh() {} }) },
    './workspace/ContactHeader': { ContactHeader: 'contact-header' },
  };
  for (const panel of panels) bindings['./workspace/' + panel] = { [panel]: 'panel:' + panel };
  const { ContactWorkspace } = ui.load('src/features/crm/components/contacts/ContactWorkspace.tsx', bindings);
  const props = { contact: { id: 'contact', songRequests: [] }, tasks: [], appointments: [], invoices: [], files: [], timeline: [], canImpersonate: false };
  assert.ok(find(ui.render(ContactWorkspace, props), node => node.type === 'panel:ContactSummary'));
  find(ui.render(), node => node.type === 'contact-header').props.onOpenEmails();
  assert.ok(find(ui.render(), node => node.type === 'panel:ContactEmails'));
  search = '?tab=tasks';
  assert.ok(find(ui.render(), node => node.type === 'panel:ContactTasks'));
  search = '?tab=summary';
  assert.ok(find(ui.render(), node => node.type === 'panel:ContactSummary'));
});

test('public menu closes across navigation and remains closed on history return', () => {
  const ui = createRuntime(); let pathname = '/radio';
  const { Header } = ui.load('src/components/layout/Header.tsx', {
    'next/navigation': { usePathname: () => pathname },
    '@/components/radio/ShareMenu': { ShareMenu: 'share-menu' },
    '@/components/analytics/VisitorCounters': { VisitorCounters: 'counters' },
  });
  const toggle = tree => find(tree, node => node.props?.['aria-controls'] === 'mobile-main-menu');
  toggle(ui.render(Header)).props.onClick();
  assert.equal(toggle(ui.render()).props['aria-expanded'], true);
  pathname = '/album'; assert.equal(toggle(ui.render()).props['aria-expanded'], false);
  pathname = '/radio'; assert.equal(toggle(ui.render()).props['aria-expanded'], false);
  ui.unmount();
});

test('CRM sidebar keeps stored preference on hydration and mobile menu closes on route return', () => {
  const storage = new Map([['nowis_crm_sidebar_open', '0']]);
  const ui = createRuntime({ server: true, storage }); let pathname = '/crm/dashboard';
  const { CrmShell } = ui.load('src/features/crm/components/layout/CrmShell.tsx', {
    'next/navigation': { usePathname: () => pathname },
    '@/features/crm/components/layout/CrmSidebar': { CrmSidebar: 'crm-sidebar' },
    '@/features/crm/components/layout/CrmTopbar': { CrmTopbar: 'crm-topbar' },
  });
  const props = { session: { role: 'ADMIN' }, children: 'Content' };
  const sidebar = tree => find(tree, node => node.type === 'crm-sidebar');
  assert.equal(sidebar(ui.render(CrmShell, props)).props.isOpen, true);
  ui.server = false;
  assert.equal(sidebar(ui.render()).props.isOpen, false);
  assert.equal(storage.get('nowis_crm_sidebar_open'), '0', 'Hydration must not overwrite the preference');
  sidebar(ui.render()).props.onToggle();
  assert.equal(sidebar(ui.render()).props.isOpen, true);
  find(ui.render(), node => node.type === 'crm-topbar').props.onMobileMenuOpen();
  assert.ok(find(ui.render(), node => node.props?.['aria-label'] === 'Fermer le menu'));
  pathname = '/crm/contacts';
  assert.equal(find(ui.render(), node => node.props?.['aria-label'] === 'Fermer le menu'), null);
  pathname = '/crm/dashboard';
  assert.equal(find(ui.render(), node => node.props?.['aria-label'] === 'Fermer le menu'), null);
  assert.notEqual(ui.document.body.style.overflow, 'hidden');
  ui.window.localStorage.getItem = () => { throw new Error('Storage blocked'); };
  ui.window.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  sidebar(ui.render()).props.onToggle();
  assert.equal(sidebar(ui.render()).props.isOpen, false, 'Blocked optional storage must not prevent the toggle');
  ui.unmount();
});

test('song request pagination resets with filters and clamps shrinking data', () => {
  const ui = createRuntime();
  const { SongRequestsPage } = ui.load('src/features/crm/components/song-requests/SongRequestsPage.tsx', {
    '@/features/crm/components/shared/StatusBadge': { StatusBadge: 'badge' },
  });
  const items = Array.from({ length: 45 }, (_, index) => ({
    id: String(index), title: 'Song ' + index, fullName: 'Client ' + index,
    email: 'client@example.test', eventType: 'Anniversaire', status: 'NEW', createdAt: '2026-10-01T12:00:00Z',
    songType: 'CUSTOM', theme: '', language: 'fr', contact: { id: 'contact-' + index, fullName: 'Client ' + index, email: 'client@example.test' },
  }));
  button(ui.render(SongRequestsPage, { items }), 'Suivant').props.onClick();
  button(ui.render(), 'Suivant').props.onClick();
  assert.match(text(ui.render()), /Page\s+3\s*\/\s*3/);
  assert.match(text(ui.render(SongRequestsPage, { items: items.slice(0, 25) })), /Page\s+2\s*\/\s*2/);
  button(ui.render(), 'Précédent').props.onClick();
  assert.match(text(ui.render()), /Page\s+1\s*\/\s*2/);
  button(ui.render(), 'Suivant').props.onClick();
  find(ui.render(), node => node.type === 'input').props.onChange({ target: { value: 'Client' } });
  assert.match(text(ui.render()), /Page\s+1\s*\/\s*2/);
});

test('assistant uses authoritative GET quota with anonymous legacy context and blocks pending refreshes', async () => {
  const ui = createRuntime(); let pathname = '/radio';
  const safeNext = ui.load('src/lib/safe-next.ts');
  const { SiteAssistant } = ui.load('src/components/assistant/SiteAssistant.tsx', {
    'next/navigation': { usePathname: () => pathname },
    '@/contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '@/lib/safe-next': safeNext,
  });
  const toggle = tree => find(tree, node => node.props?.['aria-controls'] === 'nowis-site-assistant');
  const input = tree => find(tree, node => node.props?.placeholder === 'Où puis-je trouver…?');
  const quota = remaining => ({ limit: 20, remaining, resetAt: '2099-10-06T04:00:00.000Z', timeZone: 'America/Toronto' });
  toggle(ui.render(SiteAssistant)).props.onClick();
  assert.equal(input(ui.render()).props.disabled, true);
  ui.requests[0].respond(401, { code: 'AUTH_REQUIRED', error: 'Connectez-vous.' });
  let tree = await ui.flush();
  assert.equal(input(tree).props.disabled, true);
  assert.ok(find(tree, node => node.type === 'a' && node.props.href === '/connexion?next=%2Fradio'));
  toggle(tree).props.onClick(); ui.render(); toggle(ui.render()).props.onClick();
  assert.equal(input(ui.render()).props.disabled, true);
  ui.requests[1].respond(200, { quota: quota(1) });
  tree = await ui.flush();
  assert.equal(input(tree).props.disabled, false, 'Verified server identity is independent of legacy AuthContext');
  input(tree).props.onChange({ target: { value: 'Où est mon compte?' } });
  const submission = find(ui.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(ui.requests[2].options.method, 'POST');
  ui.requests[2].respond(200, { reply: 'Votre portail est disponible.', quota: quota(0) });
  await submission; tree = await ui.flush();
  assert.equal(input(tree).props.disabled, true);
  assert.match(text(tree), /atteint la limite de 20 commandes/);
  ui.window.dispatchEvent(new Event('focus'));
  assert.equal(input(ui.render()).props.disabled, true);
  ui.requests[3].respond(200, { quota: quota(20) });
  assert.equal(input(await ui.flush()).props.disabled, false);
  pathname = '/album'; assert.equal(input(ui.render()).props.disabled, true);
  ui.requests[4].respond(401, { code: 'AUTH_REQUIRED', error: 'Connectez-vous.' });
  assert.equal(input(await ui.flush()).props.disabled, true);
  ui.unmount();
});

test('assistant discards a late auth error from the previous route', async () => {
  const ui = createRuntime(); let pathname = '/radio';
  const { SiteAssistant } = ui.load('src/components/assistant/SiteAssistant.tsx', {
    'next/navigation': { usePathname: () => pathname },
    '@/contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '@/lib/safe-next': ui.load('src/lib/safe-next.ts'),
  });
  find(ui.render(SiteAssistant), node => node.props?.['aria-controls'] === 'nowis-site-assistant').props.onClick();
  ui.render(); pathname = '/album'; ui.render();
  assert.equal(ui.requests[0].options.signal.aborted, true);
  ui.requests[1].respond(200, { quota: { limit: 20, remaining: 12, resetAt: '2099-10-06T04:00:00.000Z', timeZone: 'America/Toronto' } });
  await ui.flush();
  ui.requests[0].respond(401, { code: 'AUTH_REQUIRED', error: 'Connectez-vous.' });
  const tree = await ui.flush();
  assert.equal(find(tree, node => node.props?.placeholder === 'Où puis-je trouver…?').props.disabled, false);
  assert.match(text(tree), /12 commande/);
  ui.unmount();
});

test('finance amount follows inventory and quantity while preserving a manual price until its source changes', () => {
  const ui = createRuntime();
  const { FinanceSaleFormPage } = ui.load('src/features/crm/components/finance/FinanceFormPages.tsx', {
    '@/features/crm/components/shared/FileUploader': { FileUploader: 'file-uploader' },
    '@/features/crm/finance/constants': ui.load('src/features/crm/finance/constants.ts'),
  });
  const inventory = [{ id: 'usb', label: 'Clé USB', category: 'USB_16GB', salePrice: '10', quantityRemaining: 10, lowStockThreshold: 1 }];
  const props = { contacts: [], invoices: [], inventory };
  const field = (tree, name) => find(tree, node => node.props?.name === name);
  field(ui.render(FinanceSaleFormPage, props), 'inventoryItemId').props.onChange({ target: { value: 'usb' } });
  let tree = ui.render();
  assert.equal(field(tree, 'amountBeforeTax').props.value, '10.00');
  assert.equal(field(tree, 'description').props.value, 'Clé USB');
  field(tree, 'amountBeforeTax').props.onChange({ target: { value: '8.50' } });
  tree = ui.render(); assert.equal(field(tree, 'amountBeforeTax').props.value, '8.50');
  field(tree, 'quantity').props.onChange({ target: { value: '3' } });
  tree = ui.render(); assert.equal(field(tree, 'amountBeforeTax').props.value, '30.00');
  field(tree, 'description').props.onChange({ target: { value: 'Prix de groupe' } });
  tree = ui.render(FinanceSaleFormPage, { ...props, inventory: [{ ...inventory[0], salePrice: '12' }] });
  assert.equal(field(tree, 'amountBeforeTax').props.value, '36.00');
  assert.equal(field(tree, 'description').props.value, 'Prix de groupe');
  field(tree, 'inventoryItemId').props.onChange({ target: { value: '' } });
  tree = ui.render();
  assert.equal(field(tree, 'amountBeforeTax').props.value, '0');
  assert.equal(field(tree, 'category').props.value, 'OTHER');
});

test('radio bootstrap restores paused selection and position without overwriting active playback', async () => {
  const radioTracks = require('../src/data/radio-tracks.json');
  const albumTracks = require('../src/data/album-tracks.json');
  const tracks = [...radioTracks, ...albumTracks];
  const catalog = JSON.stringify(tracks.map(({ id, src }) => [id, src]));
  const saved = { catalog, current: 2, queue: [1, 3], position: 73.5, selection: [1, 2, 3], selectionLabel: 'Ma liste' };
  const storage = new Map([['nowis-radio-session-v1', JSON.stringify(saved)]]);
  const audio = {
    src: '', volume: 0, currentTime: 0, duration: 200, readyState: 4, paused: true, error: null, plays: 0,
    getAttribute: function () { return this.src; },
    removeAttribute: function () { this.src = ''; }, load() {},
    play: function () { this.paused = false; this.plays++; return Promise.resolve(); },
    pause: function () { this.paused = true; },
  };
  const ui = createRuntime({ server: true, storage, audio });
  const sessionHelpers = ui.load('src/lib/radio-session.ts');
  const shuffleHelpers = ui.load('src/lib/radio-shuffle.ts');
  const queueHelpers = ui.load('src/lib/radio-queue.ts', { './radio-shuffle': shuffleHelpers });
  const { RadioProvider } = ui.load('src/components/radio/RadioProvider.tsx', {
    '@/lib/radio-session': sessionHelpers, '@/lib/radio-queue': queueHelpers,
    '@/data/radio-tracks.json': radioTracks, '@/data/album-tracks.json': albumTracks,
    './ShareMenu': { ShareMenu: 'share-menu' },
  });
  const value = tree => tree.props.value;
  assert.equal(value(ui.render(RadioProvider, { children: 'Page' })).selectedTrack, null);
  ui.server = false;
  let tree = ui.render();
  assert.equal(value(tree).selectedTrack.id, tracks[2].id);
  assert.equal(value(tree).track, null); assert.equal(value(tree).playing, false);
  assert.equal(value(tree).totalTracks, 3); assert.equal(value(tree).positionInCycle, 1);
  assert.equal(audio.plays, 0, 'Hydration must never start audio');
  value(tree).toggle(); tree = await ui.flush();
  find(tree, node => node.type === 'audio').props.onLoadedMetadata();
  assert.equal(audio.currentTime, 73.5); assert.equal(audio.plays, 1);
  value(tree).next(); tree = await ui.flush();
  assert.equal(value(tree).selectedTrack.id, tracks[1].id);
  assert.equal(value(tree).positionInCycle, 2);
  audio.currentTime = 21;
  find(tree, node => node.type === 'audio').props.onTimeUpdate();
  assert.equal(JSON.parse(storage.get('nowis-radio-session-v1')).position, 21);
  assert.equal(value(ui.render()).selectedTrack.id, tracks[1].id, 'Progress storage writes must not restore the bootstrap song');
  value(tree).clearSelection(); tree = ui.render();
  assert.equal(value(tree).selectedTrack, null); assert.equal(value(tree).isSelection, false);
  assert.equal(storage.has('nowis-radio-session-v1'), false);
  ui.unmount();
});
