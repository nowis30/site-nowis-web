import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const toolbar = readFileSync(new URL('../src/features/client-portal/components/ui/ListToolbar.tsx', import.meta.url), 'utf8');
const quickActions = readFileSync(new URL('../src/features/client-portal/components/ui/QuickActions.tsx', import.meta.url), 'utf8');
const emptyState = readFileSync(new URL('../src/features/client-portal/components/ui/EmptyState.tsx', import.meta.url), 'utf8');

test('client list toolbar keeps filters and actions touch friendly', () => {
  assert.match(toolbar, /min-h-11/);
  assert.match(toolbar, /border-primary-500\/15/);
  assert.match(toolbar, /aria-current=\{filter\.active \? 'page' : undefined\}/);
  assert.match(toolbar, /motion-reduce:transition-none/);
});

test('quick actions handle external destinations safely', () => {
  assert.match(quickActions, /const isExternal =/);
  assert.match(quickActions, /target=\{isExternal \? '_blank' : undefined\}/);
  assert.match(quickActions, /noopener noreferrer/);
  assert.match(quickActions, /ouvre un nouvel onglet/);
  assert.match(quickActions, /min-h-24/);
});

test('empty states follow the shared portal visual hierarchy', () => {
  assert.match(emptyState, /border-primary-500\/20/);
  assert.match(emptyState, /bg-primary-500\/10/);
  assert.match(emptyState, /aria-hidden="true"/);
  assert.match(emptyState, /max-w-2xl/);
});
