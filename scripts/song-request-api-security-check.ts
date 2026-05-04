import { PrismaClient, ContactType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();
const ROOT = process.cwd();
const PORT = 3105;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CLIENT_COOKIE_NAME = 'nowis_client_session';
const CRM_COOKIE_NAME = 'crm_session';
const FORBIDDEN_KEYS = [
  'folderUrl',
  'driveFolderUrl',
  'documentFolderUrl',
  'clientPortalUrl',
  'crmUrl',
  'internalNotes',
  'adminNotes',
  'sourceSongRequestId',
  'invoiceId',
  'quoteId',
  'commercialQuoteId',
  'contactId',
  'organizationId',
  'createdById',
  'updatedById',
  'invoices',
  'quotes',
  'contact',
  'organization',
  'fileUrl',
  'meetingNotes',
  'location',
  'meetingDate',
  'startAt',
  'endAt',
  'durationMinutes',
  'meetingType',
  'convertedInvoiceId',
  'convertedAppointmentId',
];

const report: Array<{
  name: string;
  endpoint: string;
  expected: string;
  obtained: string;
  ok: boolean;
  details?: string;
}> = [];

function parseEnvFile(fileName: string) {
  const fullPath = join(ROOT, fileName);
  try {
    const raw = readFileSync(fullPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore missing env file
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable manquante: ${name}`);
  return value;
}

function signClientCookie(contactId: string, email: string, fullName: string) {
  const secret = process.env.CLIENT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'dev-only-portal-secret-must-change';
  const token = jwt.sign(
    {
      scope: 'client-dashboard',
      role: 'CLIENT',
      contactId,
      tenantId: null,
      email,
      fullName,
    },
    secret,
    { expiresIn: '14d' },
  );
  return `${CLIENT_COOKIE_NAME}=${token}`;
}

function signCrmCookie(role: 'ADMIN' | 'ASSISTANT' | 'PORTAL_USER') {
  const secret = process.env.JWT_SECRET || 'dev-only-secret-must-change-before-prod';
  const token = jwt.sign(
    {
      sub: randomUUID(),
      role,
      email: `audit-${role.toLowerCase()}@nowis.local`,
      fullName: `Audit ${role}`,
    },
    secret,
    { expiresIn: '30d' },
  );
  return `${CRM_COOKIE_NAME}=${token}`;
}

function hasForbiddenKeys(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    for (const [key, nested] of Object.entries(node)) {
      if (FORBIDDEN_KEYS.includes(key)) found.add(key);
      visit(nested);
    }
  };
  visit(value);
  return [...found];
}

function pushResult(entry: {
  name: string;
  endpoint: string;
  expected: string;
  obtained: string;
  ok: boolean;
  details?: string;
}) {
  report.push(entry);
  const status = entry.ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${entry.name}`);
  console.log(`  endpoint: ${entry.endpoint}`);
  console.log(`  expected: ${entry.expected}`);
  console.log(`  obtained: ${entry.obtained}`);
  if (entry.details) console.log(`  details: ${entry.details}`);
}

async function waitForServerReady(child: ChildProcess) {
  const start = Date.now();
  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  while (Date.now() - start < 120000) {
    try {
      const response = await fetch(`${BASE_URL}/api/health/db`);
      if (response.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Serveur local non pret.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { response, json };
}

async function main() {
  parseEnvFile('.env.local');
  parseEnvFile('.env');
  requireEnv('DATABASE_URL');
  requireEnv('JWT_SECRET');

  const unique = Date.now();
  const clientAEmail = `audit-client-a-${unique}@nowis.local`;
  const clientBEmail = `audit-client-b-${unique}@nowis.local`;
  let server: ChildProcess | null = null;
  let contactAId = '';
  let contactBId = '';
  let songAId = '';
  let songBId = '';

  try {
    const [contactA, contactB] = await prisma.$transaction([
      prisma.contact.create({
        data: {
          type: ContactType.CLIENT,
          fullName: 'Audit Client A',
          email: clientAEmail,
          phone: '555-1000',
          source: 'audit-script',
          tags: ['audit', 'client-a'],
        },
      }),
      prisma.contact.create({
        data: {
          type: ContactType.CLIENT,
          fullName: 'Audit Client B',
          email: clientBEmail,
          phone: '555-2000',
          source: 'audit-script',
          tags: ['audit', 'client-b'],
        },
      }),
    ]);

    contactAId = contactA.id;
    contactBId = contactB.id;

    const [songA, songB] = await prisma.$transaction([
      prisma.songRequest.create({
        data: {
          contactId: contactA.id,
          title: 'Chanson audit A',
          fullName: contactA.fullName,
          email: contactA.email || clientAEmail,
          phone: contactA.phone || '555-1000',
          songType: 'Chanson anniversaire',
          language: 'Francais',
          occasion: 'Anniversaire',
          eventType: 'Anniversaire',
          recipientName: 'Personne A',
          specialMessage: 'Message client visible',
          style: 'Pop',
          mood: 'Emotive',
          theme: 'Famille',
          description: 'Description client visible',
          inspirations: 'Reference interne potentielle',
          lyrics: 'Paroles visibles',
          structureVerse: 'Couplet interne',
          structureChorus: 'Refrain interne',
          structureBridge: 'Pont interne',
          fileUrl: 'https://internal.nowis.local/folder-a',
          details: 'Consignes client visibles',
          desiredDeadline: new Date('2026-06-15T00:00:00.000Z'),
          meetingNotes: 'Note interne',
          location: 'Salle interne',
          source: 'audit-script',
          status: 'NEW',
        },
      }),
      prisma.songRequest.create({
        data: {
          contactId: contactB.id,
          title: 'Chanson audit B',
          fullName: contactB.fullName,
          email: contactB.email || clientBEmail,
          phone: contactB.phone || '555-2000',
          songType: 'Chanson hommage',
          language: 'Francais',
          occasion: 'Hommage',
          eventType: 'Hommage',
          recipientName: 'Personne B',
          specialMessage: 'Message client B',
          style: 'Folk',
          mood: 'Sincere',
          theme: 'Souvenir',
          description: 'Description client B',
          lyrics: 'Paroles B',
          structureVerse: 'Couplet B',
          structureChorus: 'Refrain B',
          details: 'Consignes B',
          source: 'audit-script',
          status: 'NEW',
        },
      }),
    ]);

    songAId = songA.id;
    songBId = songB.id;

    const env = {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      CLIENT_PORTAL_JWT_SECRET: process.env.CLIENT_PORTAL_JWT_SECRET || process.env.JWT_SECRET,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3105',
      NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'http://127.0.0.1:3105',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3105',
    };

    server = process.platform === 'win32'
      ? spawn('powershell.exe', ['-NoProfile', '-Command', `cd '${ROOT.replace(/'/g, "''")}'; npx next dev -p ${PORT}`], {
          cwd: ROOT,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : spawn('npx', ['next', 'dev', '-p', String(PORT)], {
          cwd: ROOT,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

    await waitForServerReady(server);

    const clientACookie = signClientCookie(contactA.id, clientAEmail, contactA.fullName);
    const clientBCookie = signClientCookie(contactB.id, clientBEmail, contactB.fullName);
    const crmAdminCookie = signCrmCookie('ADMIN');
    const crmDeniedCookie = signCrmCookie('PORTAL_USER');
    const missingId = randomUUID();

    {
      const { response } = await requestJson('/api/client/song-requests');
      pushResult({
        name: '1. GET client list sans session',
        endpoint: 'GET /api/client/song-requests',
        expected: '401',
        obtained: String(response.status),
        ok: response.status === 401,
      });
    }

    {
      const { response, json } = await requestJson('/api/client/song-requests', {
        headers: { cookie: clientACookie },
      });
      const items = Array.isArray((json as { items?: unknown[] } | null)?.items) ? (json as { items: unknown[] }).items : [];
      const ids = items.map((item) => (item && typeof item === 'object' ? (item as { id?: string }).id : undefined)).filter(Boolean);
      const forbidden = hasForbiddenKeys(json);
      pushResult({
        name: '2. GET client list avec session valide',
        endpoint: 'GET /api/client/song-requests',
        expected: '200, seulement les demandes du client, aucun champ interne',
        obtained: `${response.status}, ids=${ids.join(', ') || 'aucun'}, forbidden=${forbidden.join(', ') || 'aucun'}`,
        ok: response.status === 200 && ids.length === 1 && ids[0] === songA.id && forbidden.length === 0,
      });
    }

    {
      const { response, json } = await requestJson(`/api/client/song-requests/${songA.id}`, {
        headers: { cookie: clientACookie },
      });
      const forbidden = hasForbiddenKeys(json);
      pushResult({
        name: '3. GET client detail sur sa demande',
        endpoint: 'GET /api/client/song-requests/[id]',
        expected: '200, objet client-safe uniquement',
        obtained: `${response.status}, forbidden=${forbidden.join(', ') || 'aucun'}`,
        ok: response.status === 200 && forbidden.length === 0,
      });
    }

    {
      const { response } = await requestJson(`/api/client/song-requests/${songB.id}`, {
        headers: { cookie: clientACookie },
      });
      pushResult({
        name: '4. GET client detail autre client',
        endpoint: 'GET /api/client/song-requests/[id]',
        expected: '403',
        obtained: String(response.status),
        ok: response.status === 403,
      });
    }

    {
      const { response } = await requestJson(`/api/client/song-requests/${missingId}`, {
        headers: { cookie: clientACookie },
      });
      pushResult({
        name: '5. GET client detail inexistant',
        endpoint: 'GET /api/client/song-requests/[id]',
        expected: '404',
        obtained: String(response.status),
        ok: response.status === 404,
      });
    }

    {
      const { response } = await requestJson(`/api/client/song-requests/${songA.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Sans session' }),
      });
      pushResult({
        name: '6. PATCH client sans session',
        endpoint: 'PATCH /api/client/song-requests/[id]',
        expected: '401',
        obtained: String(response.status),
        ok: response.status === 401,
      });
    }

    {
      const payload = {
        title: 'Titre modifie audit',
        description: 'Description modifiee audit',
        musicStyle: 'Jazz',
        mood: 'Festive',
        lyrics: 'Nouvelles paroles audit',
        clientNotes: 'Nouvelles consignes audit',
        desiredDeadline: '2026-07-01T00:00:00.000Z',
      };
      const { response, json } = await requestJson(`/api/client/song-requests/${songA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: clientACookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const forbidden = hasForbiddenKeys(json);
      const updated = await prisma.songRequest.findUnique({ where: { id: songA.id } });
      const savedOk = updated?.title === payload.title && updated?.style === payload.musicStyle && updated?.mood === payload.mood && updated?.lyrics === payload.lyrics && updated?.details === payload.clientNotes;
      pushResult({
        name: '7. PATCH client avec champs autorises',
        endpoint: 'PATCH /api/client/song-requests/[id]',
        expected: '200, sauvegarde ok, reponse client-safe',
        obtained: `${response.status}, saved=${savedOk ? 'oui' : 'non'}, forbidden=${forbidden.join(', ') || 'aucun'}`,
        ok: response.status === 200 && Boolean(savedOk) && forbidden.length === 0,
      });
    }

    {
      const before = await prisma.songRequest.findUnique({ where: { id: songA.id } });
      const { response } = await requestJson(`/api/client/song-requests/${songA.id}`, {
        method: 'PATCH',
        headers: {
          cookie: clientACookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test interdit',
          sourceSongRequestId: 'abc',
          folderUrl: 'https://test.com',
          internalNotes: 'ne devrait jamais passer',
        }),
      });
      const after = await prisma.songRequest.findUnique({ where: { id: songA.id } });
      const unchanged = before?.title === after?.title && before?.meetingNotes === after?.meetingNotes && before?.fileUrl === after?.fileUrl;
      pushResult({
        name: '8. PATCH client avec champs interdits',
        endpoint: 'PATCH /api/client/song-requests/[id]',
        expected: '400, aucune modification interdite',
        obtained: `${response.status}, unchanged=${unchanged ? 'oui' : 'non'}`,
        ok: response.status === 400 && Boolean(unchanged),
      });
    }

    {
      const { response } = await requestJson(`/api/client/song-requests/${songB.id}`, {
        method: 'PATCH',
        headers: {
          cookie: clientACookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Interdit autre client' }),
      });
      pushResult({
        name: '9. PATCH client sur demande d un autre client',
        endpoint: 'PATCH /api/client/song-requests/[id]',
        expected: '403',
        obtained: String(response.status),
        ok: response.status === 403,
      });
    }

    {
      const { response } = await requestJson(`/api/crm/song-requests/${songA.id}`);
      pushResult({
        name: '10a. CRM GET sans session',
        endpoint: 'GET /api/crm/song-requests/[id]',
        expected: '401 ou 403',
        obtained: String(response.status),
        ok: response.status === 401 || response.status === 403,
      });
    }

    {
      const { response } = await requestJson(`/api/crm/song-requests/${songA.id}`, {
        headers: { cookie: crmDeniedCookie },
      });
      pushResult({
        name: '10b. CRM GET sans permission songRequests',
        endpoint: 'GET /api/crm/song-requests/[id]',
        expected: '403',
        obtained: String(response.status),
        ok: response.status === 403,
      });
    }

    {
      const { response, json } = await requestJson(`/api/crm/song-requests/${songA.id}`, {
        headers: { cookie: crmAdminCookie },
      });
      const item = (json as { item?: Record<string, unknown> } | null)?.item;
      const hasInternal = Boolean(item && typeof item === 'object' && ('contact' in item || 'organization' in item || 'appointments' in item || 'activities' in item || 'tasks' in item));
      pushResult({
        name: '11. CRM GET avec permission',
        endpoint: 'GET /api/crm/song-requests/[id]',
        expected: '200, infos internes presentes cote CRM',
        obtained: `${response.status}, internal=${hasInternal ? 'oui' : 'non'}`,
        ok: response.status === 200 && hasInternal,
      });
    }
  } finally {
    if (server && server.pid) {
      server.kill();
    }
    await prisma.activity.deleteMany({ where: { songRequestId: { in: [songAId, songBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.appointment.deleteMany({ where: { songRequestId: { in: [songAId, songBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.fileDocument.deleteMany({ where: { songRequestId: { in: [songAId, songBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.task.deleteMany({ where: { songRequestId: { in: [songAId, songBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.commercialQuote.deleteMany({ where: { songRequestId: { in: [songAId, songBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.songRequest.deleteMany({ where: { id: { in: [songAId, songBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.contact.deleteMany({ where: { id: { in: [contactAId, contactBId].filter(Boolean) } } }).catch(() => undefined);
    await prisma.$disconnect();
  }

  console.log('\n=== Resume ===');
  const failed = report.filter((entry) => !entry.ok);
  for (const entry of report) {
    console.log(`${entry.ok ? 'OK' : 'FAIL'} | ${entry.name} | ${entry.obtained}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} test(s) en echec.`);
    process.exitCode = 1;
  } else {
    console.log('\nTous les tests API cibles ont reussi.');
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
