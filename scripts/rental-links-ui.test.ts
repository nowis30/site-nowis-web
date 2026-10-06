import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const repoRoot = process.cwd();

const headerPath = join(repoRoot, 'src/components/layout/Header.tsx');
const homePath = join(repoRoot, 'src/screens/HomeScreen.tsx');
const footerPath = join(repoRoot, 'src/components/layout/Footer.tsx');
const envExamplePath = join(repoRoot, '.env.example');

const headerSource = readFileSync(headerPath, 'utf8');
const homeSource = readFileSync(homePath, 'utf8');
const footerSource = readFileSync(footerPath, 'utf8');
const envSource = readFileSync(envExamplePath, 'utf8');
const explorerSource = readFileSync(join(repoRoot, 'src/app/explorer/page.tsx'), 'utf8');

type UiNode = { type: unknown; props: Record<string, any> };

function findNodes(node: unknown, predicate: (element: UiNode) => boolean): UiNode[] {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((child) => findNodes(child, predicate));
  const element = node as UiNode;
  return [...(predicate(element) ? [element] : []), ...findNodes(element.props?.children, predicate)];
}

// Execute the real Header handlers. DOM measurement effects are unrelated to the
// menu state; pathname changes emulate the values Next supplies on navigation.
function loadHeader(initialPath = '/radio') {
  const requireFixture = createRequire(join(repoRoot, 'package.json'));
  const slots: Array<{ value: any }> = [];
  let pathname = initialPath, cursor = 0, changed = false;
  const module = { exports: {} as { Header: () => UiNode } };
  const code = ts.transpileModule(headerSource, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports,
    require(name: string) {
      if (name === 'react') return {
        useState(initial: any) {
          const index = cursor++;
          slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
          return [slots[index].value, (value: any) => {
            const next = typeof value === 'function' ? value(slots[index].value) : value;
            if (!Object.is(next, slots[index].value)) { slots[index].value = next; changed = true; }
          }];
        },
        useRef(initial: any) {
          const index = cursor++;
          return (slots[index] ??= { value: { current: initial } }).value;
        },
        useEffect() {},
      };
      if (name === 'react/jsx-runtime') return requireFixture(name);
      if (name === 'next/navigation') return { usePathname: () => pathname };
      if (name === 'next/link') return { __esModule: true, default: 'a' };
      if (name === 'next/image') return { __esModule: true, default: 'img' };
      if (name === '@/components/radio/ShareMenu') return { ShareMenu: 'share-menu' };
      if (name === '@/components/analytics/VisitorCounters') return { VisitorCounters: 'counters' };
      throw new Error('Unexpected Header dependency: ' + name);
    },
  });
  return {
    navigate(path: string) { pathname = path; },
    render() {
      let tree: UiNode, attempts = 0;
      do {
        assert.ok(attempts++ < 10, 'Navigation state adjustments must converge');
        cursor = 0; changed = false; tree = module.exports.Header();
      } while (changed);
      return tree;
    },
  };
}

const menuToggle = (tree: UiNode) => findNodes(tree, (node) => node.props?.['aria-controls'] === 'mobile-main-menu')[0];
const mobileMenu = (tree: UiNode) => findNodes(tree, (node) => node.props?.id === 'mobile-main-menu')[0];

test('Current desktop navigation retains Explorer access to the rental service', () => {
  assert.match(headerSource, /label: 'Explorer', href: '\/explorer'/);
  assert.match(headerSource, /nm-desktop-nav/);
  assert.match(headerSource, /primary\.map/);
});

test('The mobile menu retains the same navigation and closes on selection', () => {
  const ui = loadHeader();
  const desktop = findNodes(ui.render(), (node) => node.props?.className === 'nm-desktop-nav')[0];
  const desktopLinks = findNodes(desktop, (node) => node.type === 'a').map((node) => node.props.href);
  menuToggle(ui.render()).props.onClick();
  const menu = mobileMenu(ui.render());
  assert.ok(menu, 'The toggle must open the mobile menu');
  const links = findNodes(menu, (node) => node.type === 'a');
  assert.deepEqual(links.slice(0, 7).map((node) => node.props.href), desktopLinks.slice(0, 7));
  assert.ok(links.some((node) => node.props.href === '/explorer'));
  for (const link of links) {
    if (!mobileMenu(ui.render())) menuToggle(ui.render()).props.onClick();
    assert.equal(typeof link.props.onClick, 'function', `Mobile link ${link.props.href} needs a selection handler`);
    link.props.onClick();
    const closed = ui.render();
    assert.equal(menuToggle(closed).props['aria-expanded'], false, `${link.props.href} must close the menu`);
    assert.equal(mobileMenu(closed), undefined);
  }
});

test('The mobile menu remains closed on navigation Back and Forward', () => {
  const ui = loadHeader('/radio');
  menuToggle(ui.render()).props.onClick();
  assert.equal(menuToggle(ui.render()).props['aria-expanded'], true);
  for (const path of ['/album', '/radio', '/album']) {
    ui.navigate(path);
    const closed = ui.render();
    assert.equal(menuToggle(closed).props['aria-expanded'], false, `History navigation to ${path} must stay closed`);
    assert.equal(mobileMenu(closed), undefined);
  }
  menuToggle(ui.render()).props.onClick();
  assert.ok(mobileMenu(ui.render()));
  ui.navigate('/radio'); ui.render();
  ui.navigate('/album');
  assert.equal(mobileMenu(ui.render()), undefined, 'Forward must not resurrect the menu opened on the previous visit');
});

test('Home screen retains the album and the current Explorer route', () => {
  assert.match(homeSource, /href="\/album"/);
  assert.match(homeSource, /href="\/explorer"/);
});

test('Explorer exposes the rental destination with safe new-tab attributes', () => {
  assert.match(explorerSource, /Logements à louer/);
  assert.match(explorerSource, /href=\{rentalsPublicUrl\}/);
  assert.match(explorerSource, /target="_blank"/);
  assert.match(explorerSource, /rel="noopener noreferrer"/);
});

test('Footer contains rental links and keeps legal links unchanged', () => {
  assert.match(footerSource, /Logements à louer/);
  assert.match(footerSource, /Voir les logements disponibles →/);
  assert.match(footerSource, /target="_blank"/);
  assert.match(footerSource, /rel="noopener noreferrer"/);
  assert.match(footerSource, /Mentions légales/);
  assert.match(footerSource, /Politique de confidentialité/);
  assert.match(footerSource, /Conditions de vente/);
});

test('Environment example documents NEXT_PUBLIC_RENTALS_URL', () => {
  assert.match(envSource, /NEXT_PUBLIC_RENTALS_URL=/);
});

test('Rentals URL constant supports default and custom domain', async () => {
  const modulePath = join(repoRoot, 'src/lib/rentals-url.ts');
  const mod = await import(pathToFileURL(modulePath).href);

  assert.equal(
    mod.resolveRentalsPublicUrl(undefined),
    'https://simon-morin-agent-location.onrender.com',
  );

  assert.equal(
    mod.resolveRentalsPublicUrl('https://logements.nowis.store'),
    'https://logements.nowis.store',
  );
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,<script>', 'http://example.com', '//evil.test', '/connexion', 'https://user:pass@example.com']) {
    assert.equal(mod.resolveRentalsPublicUrl(unsafe), mod.resolveRentalsPublicUrl(undefined));
  }
  assert.equal(mod.resolveRentalsPublicUrl('  https://logements.nowis.store  '), 'https://logements.nowis.store');
});

test('Client portal link remains present', () => {
  assert.match(headerSource, /Portail client/);
  assert.match(footerSource, /Portail client/);
});
