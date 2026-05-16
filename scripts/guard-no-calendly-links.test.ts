import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const REPO_ROOT = process.cwd();

const SCAN_TARGETS = [
  'src',
  'docs',
  'scripts',
  'prisma',
  '.env.example',
  'NOTES_HUMAINES.md',
];

const IGNORE_DIRS = new Set([
  '.next',
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
]);

const ALLOWED_LEGACY_PATHS = [
  /^src\/app\/api\/webhooks\/calendly\//,
  /^src\/app\/api\/crm\/calendar\/calendly-[^/]+\/route\.ts$/,
  /^src\/components\/booking\/BookingEmbed\.tsx$/,
  /^src\/app\/api\/crm\/workshop-requests\/route\.ts$/,
  /^src\/app\/api\/crm\/workshop-requests\/\[id\]\/route\.ts$/,
  /^scripts\/appointment-business-rules\.test\.ts$/,
  /^scripts\/booking-migration-rules\.test\.ts$/,
  /^scripts\/guard-no-calendly-links\.test\.ts$/,
];

const CALENDLY_LINK_REGEX = /https?:\/\/(?:api\.)?calendly\.com|https?:\/\/assets\.calendly\.com|calendly\.com\//gi;

function isTextFile(path: string) {
  return /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|sql|prisma|env)$/i.test(path)
    || path === '.env.example'
    || path === 'NOTES_HUMAINES.md';
}

function isAllowedLegacyPath(path: string) {
  return ALLOWED_LEGACY_PATHS.some((pattern) => pattern.test(path));
}

function collectFiles(targetPath: string, bucket: string[]) {
  if (!existsSync(targetPath)) return;

  const info = statSync(targetPath);
  if (info.isFile()) {
    const rel = relative(REPO_ROOT, targetPath).replace(/\\/g, '/');
    if (isTextFile(rel)) bucket.push(targetPath);
    return;
  }

  for (const child of readdirSync(targetPath)) {
    if (IGNORE_DIRS.has(child)) continue;
    collectFiles(join(targetPath, child), bucket);
  }
}

test('Aucun lien calendly.com hors legacy autorisé', () => {
  const files: string[] = [];
  for (const target of SCAN_TARGETS) {
    collectFiles(join(REPO_ROOT, target), files);
  }

  const violations: string[] = [];

  for (const absPath of files) {
    const relPath = relative(REPO_ROOT, absPath).replace(/\\/g, '/');
    if (isAllowedLegacyPath(relPath)) continue;

    const content = readFileSync(absPath, 'utf8');
    const matches = content.match(CALENDLY_LINK_REGEX);
    if (matches && matches.length > 0) {
      violations.push(`${relPath}: ${matches[0]}`);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Liens calendly.com interdits hors legacy:\n${violations.join('\n')}`,
  );
});
