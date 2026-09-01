import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const pageSource = readFileSync(join(process.cwd(), 'src/app/assistant-projet/page.tsx'), 'utf8');
const assistantSource = readFileSync(join(process.cwd(), 'src/components/tools/ProjectAssistant.tsx'), 'utf8');

test('Assistant project page uses the current NOWIS visual system', () => {
  assert.match(pageSource, /section-soft/);
  assert.match(pageSource, /brand-card/);
  assert.match(pageSource, /motion-safe:transition-transform/);
  assert.doesNotMatch(pageSource, /bg-slate-50|bg-white p-8 shadow-sm/);
});

test('Project assistant exposes accessible grouped choices and live feedback', () => {
  assert.match(assistantSource, /<fieldset/);
  assert.match(assistantSource, /<legend/);
  assert.match(assistantSource, /aria-pressed=\{isActive\}/);
  assert.match(assistantSource, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(assistantSource, /focus-visible:ring-2/);
});

test('Project assistant keeps touch targets and reduced-motion friendly transitions', () => {
  assert.match(assistantSource, /min-h-12/);
  assert.match(assistantSource, /min-h-11/);
  assert.match(assistantSource, /motion-safe:transition/);
});

test('Project assistant safely builds contact messages and supports restart', () => {
  assert.match(assistantSource, /encodeURIComponent\(projectType\)/);
  assert.match(assistantSource, /encodeURIComponent\(message\)/);
  assert.match(assistantSource, /setAnswers\(initialAnswers\)/);
  assert.match(assistantSource, /Recommencer/);
});
