import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shell = readFileSync(new URL('../src/features/client-portal/components/ClientPortalShell.tsx', import.meta.url), 'utf8');
const mobileNav = readFileSync(new URL('../src/features/client-portal/components/ClientMobileBottomNav.tsx', import.meta.url), 'utf8');
const pageHeader = readFileSync(new URL('../src/features/client-portal/components/ui/PageHeader.tsx', import.meta.url), 'utf8');
const sectionCard = readFileSync(new URL('../src/features/client-portal/components/ui/SectionCard.tsx', import.meta.url), 'utf8');
const statCard = readFileSync(new URL('../src/features/client-portal/components/ui/PortalStatCard.tsx', import.meta.url), 'utf8');

test('client portal shell exposes a keyboard skip target and visible focus states', () => {
  assert.match(shell, /href="#client-main"/);
  assert.match(shell, /id="client-main"/);
  assert.match(shell, /tabIndex=\{-1\}/);
  assert.match(shell, /focus-visible:ring-2/);
  assert.match(shell, /motion-reduce:transition-none/);
});

test('primary portal navigation uses touch-friendly controls', () => {
  assert.match(shell, /min-h-11/);
  assert.match(mobileNav, /min-h-14/);
  assert.match(mobileNav, /pb-\[env\(safe-area-inset-bottom\)\]/);
  assert.match(mobileNav, /aria-current=\{isActive \? 'page' : undefined\}/);
});

test('mobile navigation remains visually coherent with the dark client portal', () => {
  assert.match(mobileNav, /bg-slate-950\/95/);
  assert.match(mobileNav, /border-primary-500\/20/);
  assert.doesNotMatch(mobileNav, /bg-white\/95/);
  assert.match(mobileNav, /aria-hidden="true"/);
});

test('shared client portal surfaces use consistent NOWIS hierarchy', () => {
  assert.match(pageHeader, /border-primary-500\/20/);
  assert.match(pageHeader, /text-primary-300/);
  assert.match(sectionCard, /border-primary-500\/15/);
  assert.match(statCard, /<dl/);
  assert.match(statCard, /<dt/);
  assert.match(statCard, /<dd/);
});
