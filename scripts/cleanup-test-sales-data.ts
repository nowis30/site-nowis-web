/**
 * cleanup-test-sales-data.ts
 *
 * Nettoyage contrôlé des soumissions et factures de test CRM/PayPal.
 *
 * Modes :
 *   --dry-run            (défaut) Analyse sans modifier quoi que ce soit.
 *   --archive            Archive côté CRM uniquement.
 *   --delete-confirmed   Suppression soft (deletedAt) pour factures marquées isTest.
 *   --cancel-paypal      En combinaison avec --archive : annule/supprime côté PayPal live.
 *
 * Usage :
 *   npm run crm:cleanup-test-sales:dry
 *   npm run crm:cleanup-test-sales:archive
 *   npm run crm:cleanup-test-sales:archive -- --cancel-paypal
 *   npm run crm:cleanup-test-sales:delete-confirmed
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { prisma } from '../src/lib/prisma';

// ─── Configuration de protection ────────────────────────────────────────────

const SAFE_KEEP_KEYWORDS = [
  'résidence',
  'residence',
  'présentation',
  'presentation',
];

const TEST_KEYWORDS = [
  'test',
  'sandbox',
  'fake',
  'faux',
  'essai',
  'dummy',
  'demo',
  'paypal test',
];

const TEST_AMOUNTS_CENTS = [100, 200, 500, 1000]; // 1$, 2$, 5$, 10$

// ─── Types rapport ───────────────────────────────────────────────────────────

interface ReportInvoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  isTest: boolean;
  contactName: string;
  contactEmail: string | null;
  paypalInvoiceId: string | null;
  paypalStatus: string | null;
  paypalLiveCheck: PayPalLiveStatus | null;
  reason: string;
}

interface ReportQuote {
  id: string;
  quoteNumber: string;
  title: string;
  contactName: string;
  contactEmail: string | null;
  status: string;
  totalAmount: number;
  reason: string;
}

interface ReportDocument {
  id: string;
  filename: string;
  invoiceId: string | null;
  commercialQuoteId: string | null;
  visibility: string;
}

interface PayPalLiveStatus {
  checked: boolean;
  ok: boolean;
  remoteStatus: string | null;
  action: 'delete' | 'cancel' | 'none' | 'warn_paid' | 'warn_not_authorized' | null;
  error: string | null;
}

interface CleanupReport {
  runAt: string;
  mode: 'dry-run' | 'archive' | 'delete-confirmed';
  cancelPaypal: boolean;
  kept: Array<{ type: string; id: string; label: string; reason: string }>;
  skippedRealResidence: Array<{ type: string; id: string; label: string }>;
  archivedQuotes: ReportQuote[];
  archivedInvoices: ReportInvoice[];
  hiddenDocuments: ReportDocument[];
  paypalToCancel: string[];
  paypalToDelete: string[];
  warnings: string[];
  errors: string[];
  summary: {
    totalQuotesCandidates: number;
    totalInvoicesCandidates: number;
    totalDocumentsCandidates: number;
    totalActivitiesLinked: number;
    totalPaypalLinked: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function containsKeyword(value: string | null | undefined, keywords: string[]) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function isSafeKeep(texts: Array<string | null | undefined>) {
  return texts.some((t) => containsKeyword(t, SAFE_KEEP_KEYWORDS));
}

function isTestCandidate(texts: Array<string | null | undefined>, amountCents?: number) {
  if (texts.some((t) => containsKeyword(t, TEST_KEYWORDS))) return true;
  if (amountCents !== undefined && TEST_AMOUNTS_CENTS.includes(amountCents)) return true;
  return false;
}

function nowTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getMode(): 'dry-run' | 'archive' | 'delete-confirmed' {
  if (process.argv.includes('--delete-confirmed')) return 'delete-confirmed';
  if (process.argv.includes('--archive')) return 'archive';
  return 'dry-run';
}

function getCancelPaypal() {
  return process.argv.includes('--cancel-paypal');
}

// ─── PayPal helpers ───────────────────────────────────────────────────────────

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  const baseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) return null;

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) return null;
    const payload = await response.json() as { access_token?: string };
    return payload.access_token ?? null;
  } catch {
    return null;
  }
}

async function checkPayPalInvoiceLive(
  paypalInvoiceId: string,
  token: string | null,
  baseUrl: string,
): Promise<PayPalLiveStatus> {
  if (!token) {
    return {
      checked: false,
      ok: false,
      remoteStatus: null,
      action: null,
      error: 'Aucun access token PayPal disponible.',
    };
  }

  try {
    const response = await fetch(`${baseUrl}/v2/invoicing/invoices/${paypalInvoiceId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        checked: true,
        ok: false,
        remoteStatus: null,
        action: 'warn_not_authorized',
        error: `NOT_AUTHORIZED (${response.status}) - facture appartient peut-être à un autre compte/env.`,
      };
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>;
      return {
        checked: true,
        ok: false,
        remoteStatus: null,
        action: null,
        error: `HTTP ${response.status} - ${String((body as Record<string, unknown>).message || 'Erreur PayPal inconnue.')}`,
      };
    }

    const payload = await response.json() as Record<string, unknown>;
    const detail = (payload.detail ?? {}) as Record<string, unknown>;
    const remoteStatus = (
      (typeof payload.status === 'string' ? payload.status : null) ||
      (typeof detail.status === 'string' ? detail.status : null) ||
      null
    );

    let action: PayPalLiveStatus['action'] = 'none';
    if (remoteStatus) {
      const upper = remoteStatus.toUpperCase();
      if (upper.includes('PAID')) {
        action = 'warn_paid';
      } else if (upper.includes('DRAFT') || upper.includes('SCHEDULED')) {
        action = 'delete';
      } else if (upper.includes('SENT') || upper.includes('UNPAID') || upper.includes('SHARED')) {
        action = 'cancel';
      }
    }

    return { checked: true, ok: true, remoteStatus, action, error: null };
  } catch (error) {
    return {
      checked: true,
      ok: false,
      remoteStatus: null,
      action: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
    };
  }
}

async function cancelPayPalInvoice(paypalInvoiceId: string, token: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/v2/invoicing/invoices/${paypalInvoiceId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject: 'Annulation - Facture de test', note: 'Nettoyage données de test CRM/PayPal.' }),
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`Cancel PayPal ${paypalInvoiceId}: HTTP ${response.status} - ${String(body.message ?? 'Erreur.')}`);
  }
}

async function deletePayPalInvoice(paypalInvoiceId: string, token: string, baseUrl: string) {
  const response = await fetch(`${baseUrl}/v2/invoicing/invoices/${paypalInvoiceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`Delete PayPal ${paypalInvoiceId}: HTTP ${response.status} - ${String(body.message ?? 'Erreur.')}`);
  }
}

// ─── Programme principal ──────────────────────────────────────────────────────

async function run() {
  const mode = getMode();
  const cancelPaypalFlag = getCancelPaypal();
  const isDryRun = mode === 'dry-run';

  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  const paypalBaseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const paypalToken = isDryRun ? null : await getPayPalAccessToken();
  const paypalTokenForDryRunChecks = await getPayPalAccessToken();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  CRM/PayPal Cleanup Script`);
  console.log(`  Mode      : ${mode.toUpperCase()}`);
  console.log(`  PayPal    : ${env.toUpperCase()} (${paypalBaseUrl})`);
  console.log(`  CancelPP  : ${cancelPaypalFlag ? 'OUI (--cancel-paypal)' : 'NON'}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (!isDryRun) {
    console.log('⚠️  MODE ACTIF — des modifications vont être apportées à la base de données.');
    console.log('   Assure-toi d\'avoir lu le dry-run en premier.');
    console.log('');
  }

  const report: CleanupReport = {
    runAt: new Date().toISOString(),
    mode,
    cancelPaypal: cancelPaypalFlag,
    kept: [],
    skippedRealResidence: [],
    archivedQuotes: [],
    archivedInvoices: [],
    hiddenDocuments: [],
    paypalToCancel: [],
    paypalToDelete: [],
    warnings: [],
    errors: [],
    summary: {
      totalQuotesCandidates: 0,
      totalInvoicesCandidates: 0,
      totalDocumentsCandidates: 0,
      totalActivitiesLinked: 0,
      totalPaypalLinked: 0,
    },
  };

  // ── 1. Charger toutes les soumissions commerciales ──────────────────────
  console.log('→ Chargement des soumissions (CommercialQuote)...');
  const allQuotes = await prisma.commercialQuote.findMany({
    where: { status: { not: 'ARCHIVED' } },
    include: {
      contact: { select: { id: true, fullName: true, email: true, companyName: true } },
      organization: { select: { id: true, name: true } },
      fileDocuments: { select: { id: true, filename: true, visibility: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const quoteCandidates: typeof allQuotes = [];
  const quoteSafe: typeof allQuotes = [];

  for (const quote of allQuotes) {
    const searchTexts = [
      quote.title,
      quote.description,
      quote.notes,
      quote.internalNotes,
      quote.contact?.fullName,
      quote.contact?.email,
      quote.contact?.companyName,
      quote.organization?.name,
    ];

    const amountCents = Math.round(Number(quote.totalAmount) * 100);

    if (isSafeKeep(searchTexts)) {
      quoteSafe.push(quote);
      report.skippedRealResidence.push({
        type: 'CommercialQuote',
        id: quote.id,
        label: `${quote.quoteNumber} - ${quote.title}`,
      });
    } else if (isTestCandidate(searchTexts, amountCents)) {
      quoteCandidates.push(quote);
    } else {
      // Non protégé ET non détecté comme test → conserver avec log
      quoteSafe.push(quote);
      report.kept.push({
        type: 'CommercialQuote',
        id: quote.id,
        label: `${quote.quoteNumber} - ${quote.title}`,
        reason: 'Non détecté comme test, non lié à la résidence — conservé par prudence.',
      });
    }
  }

  report.summary.totalQuotesCandidates = quoteCandidates.length;
  console.log(`   ${allQuotes.length} total | ${quoteCandidates.length} candidats nettoyage | ${quoteSafe.length} conservés`);

  // ── 2. Charger toutes les factures ────────────────────────────────────────
  console.log('→ Chargement des factures (Invoice)...');
  const allInvoices = await prisma.invoice.findMany({
    where: {
      AND: [
        { status: { notIn: ['DELETED'] } },
        { deletedAt: null },
      ],
    },
    include: {
      contact: { select: { id: true, fullName: true, email: true, companyName: true } },
      fileDocuments: { select: { id: true, filename: true, visibility: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const invoiceCandidates: typeof allInvoices = [];
  const invoiceSafe: typeof allInvoices = [];

  for (const invoice of allInvoices) {
    const searchTexts = [
      invoice.description,
      invoice.contact?.fullName,
      invoice.contact?.email,
      invoice.contact?.companyName,
      invoice.testReason,
      invoice.deleteReason,
    ];

    const amountCents = Math.round(Number(invoice.amount) * 100);
    const alreadyMarkedTest = invoice.isTest;

    if (isSafeKeep(searchTexts)) {
      invoiceSafe.push(invoice);
      report.skippedRealResidence.push({
        type: 'Invoice',
        id: invoice.id,
        label: `${invoice.number}`,
      });
    } else if (alreadyMarkedTest || isTestCandidate(searchTexts, amountCents)) {
      invoiceCandidates.push(invoice);
    } else {
      invoiceSafe.push(invoice);
      report.kept.push({
        type: 'Invoice',
        id: invoice.id,
        label: invoice.number,
        reason: 'Non détecté comme test — conservé par prudence.',
      });
    }
  }

  report.summary.totalInvoicesCandidates = invoiceCandidates.length;
  report.summary.totalPaypalLinked = invoiceCandidates.filter((inv) => inv.paypalInvoiceId).length;
  console.log(`   ${allInvoices.length} total | ${invoiceCandidates.length} candidats nettoyage | ${invoiceSafe.length} conservés`);

  // ── 3. Statuts PayPal live pour les candidats ─────────────────────────────
  if (invoiceCandidates.some((inv) => inv.paypalInvoiceId)) {
    console.log('→ Vérification statuts PayPal live pour les candidats...');
  }

  const invoicePayPalStatuses = new Map<string, PayPalLiveStatus>();
  const effectiveToken = isDryRun ? paypalTokenForDryRunChecks : paypalToken;

  for (const invoice of invoiceCandidates) {
    if (!invoice.paypalInvoiceId) continue;
    const status = await checkPayPalInvoiceLive(invoice.paypalInvoiceId, effectiveToken, paypalBaseUrl);
    invoicePayPalStatuses.set(invoice.id, status);

    if (status.action === 'warn_paid') {
      report.warnings.push(
        `🔴 FACTURE PAYÉE — invoice ${invoice.number} (${invoice.id}) — paypalId: ${invoice.paypalInvoiceId} — NE PAS annuler automatiquement.`,
      );
    }
    if (status.action === 'warn_not_authorized') {
      report.warnings.push(
        `⚠️  NOT_AUTHORIZED — invoice ${invoice.number} (${invoice.id}) — paypalId: ${invoice.paypalInvoiceId} — appartient peut-être à un autre compte ou environnement.`,
      );
    }
  }

  // ── 4. Documents candidats ─────────────────────────────────────────────────
  const candidateQuoteIds = new Set(quoteCandidates.map((q) => q.id));
  const candidateInvoiceIds = new Set(invoiceCandidates.map((inv) => inv.id));

  const candidateDocuments = await prisma.fileDocument.findMany({
    where: {
      AND: [
        { visibility: 'CLIENT_VISIBLE' },
        {
          OR: [
            { commercialQuoteId: { in: [...candidateQuoteIds] } },
            { invoiceId: { in: [...candidateInvoiceIds] } },
          ],
        },
      ],
    },
    select: { id: true, filename: true, invoiceId: true, commercialQuoteId: true, visibility: true },
  });

  report.summary.totalDocumentsCandidates = candidateDocuments.length;
  console.log(`   ${candidateDocuments.length} document(s) candidat(s) à masquer`);

  // ── 5. Activités liées ────────────────────────────────────────────────────
  const activitiesCount = await prisma.activity.count({
    where: {
      OR: [
        { invoiceId: { in: [...candidateInvoiceIds] } },
        {
          AND: [
            { relatedType: 'CommercialQuote' },
            { relatedId: { in: [...candidateQuoteIds] } },
          ],
        },
      ],
    },
  });

  report.summary.totalActivitiesLinked = activitiesCount;
  console.log(`   ${activitiesCount} activité(s) liée(s) aux candidats`);

  // ── 6. Construction rapport ───────────────────────────────────────────────
  for (const quote of quoteCandidates) {
    report.archivedQuotes.push({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      title: quote.title,
      contactName: quote.contact?.fullName ?? '—',
      contactEmail: quote.contact?.email ?? null,
      status: quote.status,
      totalAmount: Number(quote.totalAmount),
      reason: 'Détecté comme test ou données de test',
    });
  }

  for (const invoice of invoiceCandidates) {
    const paypalCheck = invoicePayPalStatuses.get(invoice.id) ?? null;

    if (paypalCheck?.action === 'delete') {
      report.paypalToDelete.push(invoice.paypalInvoiceId!);
    } else if (paypalCheck?.action === 'cancel') {
      report.paypalToCancel.push(invoice.paypalInvoiceId!);
    }

    report.archivedInvoices.push({
      id: invoice.id,
      number: invoice.number,
      amount: Number(invoice.amount),
      status: invoice.status,
      isTest: invoice.isTest,
      contactName: invoice.contact?.fullName ?? '—',
      contactEmail: invoice.contact?.email ?? null,
      paypalInvoiceId: invoice.paypalInvoiceId,
      paypalStatus: invoice.paypalStatus,
      paypalLiveCheck: paypalCheck,
      reason: invoice.isTest ? 'Marquée isTest=true' : 'Détectée comme test',
    });
  }

  for (const doc of candidateDocuments) {
    report.hiddenDocuments.push({
      id: doc.id,
      filename: doc.filename,
      invoiceId: doc.invoiceId,
      commercialQuoteId: doc.commercialQuoteId,
      visibility: doc.visibility,
    });
  }

  // ── 7. Affichage résumé dry-run ────────────────────────────────────────────
  console.log('');
  console.log('─── RÉSUMÉ ─────────────────────────────────────────────');
  console.log(`Soumissions candidates   : ${report.summary.totalQuotesCandidates}`);
  console.log(`Factures candidates      : ${report.summary.totalInvoicesCandidates}`);
  console.log(`  dont avec PayPal       : ${report.summary.totalPaypalLinked}`);
  console.log(`  à DELETE PayPal        : ${report.paypalToDelete.length}`);
  console.log(`  à CANCEL PayPal        : ${report.paypalToCancel.length}`);
  console.log(`Documents à masquer      : ${report.summary.totalDocumentsCandidates}`);
  console.log(`Activités liées          : ${report.summary.totalActivitiesLinked}`);
  console.log(`Éléments protégés (keep) : ${report.kept.length}`);
  console.log(`Éléments résidence (skip): ${report.skippedRealResidence.length}`);

  if (report.warnings.length > 0) {
    console.log('');
    console.log('⚠️  AVERTISSEMENTS :');
    for (const w of report.warnings) {
      console.log(`   ${w}`);
    }
  }

  if (isDryRun) {
    console.log('');
    console.log('ℹ️  DRY-RUN : aucune modification effectuée.');
    console.log('   Lance --archive pour appliquer les changements CRM.');
  }

  // ── 8. Application des modifications si pas dry-run ───────────────────────
  if (!isDryRun) {
    const now = new Date();
    const archiveReason = 'Nettoyage tests CRM/PayPal';

    // 8a. Archiver les soumissions
    if (quoteCandidates.length > 0) {
      console.log('');
      console.log(`→ Archivage de ${quoteCandidates.length} soumission(s)...`);
      for (const quote of quoteCandidates) {
        try {
          const noteAppend = `\n[${now.toISOString()}] Archivée lors du nettoyage des tests CRM/PayPal.`;
          await prisma.commercialQuote.update({
            where: { id: quote.id },
            data: {
              status: 'ARCHIVED',
              internalNotes: (quote.internalNotes ?? '') + noteAppend,
            },
          });
          console.log(`   ✓ Soumission ${quote.quoteNumber} archivée.`);
        } catch (error) {
          const msg = `Erreur archivage soumission ${quote.quoteNumber}: ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(msg);
          console.error(`   ✗ ${msg}`);
        }
      }
    }

    // 8b. Marquer les factures
    if (invoiceCandidates.length > 0) {
      console.log('');
      console.log(`→ Traitement de ${invoiceCandidates.length} facture(s)...`);
      for (const invoice of invoiceCandidates) {
        try {
          const paypalCheck = invoicePayPalStatuses.get(invoice.id);

          // Ne pas traiter les factures PayPal payées sans confirmation manuelle
          if (paypalCheck?.action === 'warn_paid') {
            report.warnings.push(`Facture ${invoice.number} ignorée — PayPal statut PAID. Aucune modification.`);
            console.warn(`   ⚠️  Facture ${invoice.number} PayPal PAID — ignorée.`);
            continue;
          }

          const updateData: Record<string, unknown> = {
            isTest: true,
            testReason: archiveReason,
            archivedAt: invoice.archivedAt ?? now,
            deleteReason: mode === 'delete-confirmed' ? archiveReason : invoice.deleteReason,
          };

          if (mode === 'delete-confirmed') {
            updateData.status = 'DELETED';
            updateData.deletedAt = now;
          } else {
            // mode archive → CANCELLED seulement si pas déjà dans un état terminal
            if (!['PAID', 'CANCELLED', 'ARCHIVED', 'DELETED'].includes(invoice.status)) {
              updateData.status = 'CANCELLED';
            }
          }

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: updateData,
          });

          console.log(`   ✓ Facture ${invoice.number} ${mode === 'delete-confirmed' ? 'supprimée (soft)' : 'annulée/archivée'}.`);
        } catch (error) {
          const msg = `Erreur facture ${invoice.number}: ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(msg);
          console.error(`   ✗ ${msg}`);
        }
      }
    }

    // 8c. Masquer les documents
    if (candidateDocuments.length > 0) {
      console.log('');
      console.log(`→ Masquage de ${candidateDocuments.length} document(s)...`);
      const docIds = candidateDocuments.map((d) => d.id);
      try {
        const updated = await prisma.fileDocument.updateMany({
          where: { id: { in: docIds } },
          data: { visibility: 'ADMIN_ONLY' },
        });
        console.log(`   ✓ ${updated.count} document(s) passés en ADMIN_ONLY.`);
      } catch (error) {
        const msg = `Erreur masquage documents: ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(msg);
        console.error(`   ✗ ${msg}`);
      }
    }

    // 8d. Activité globale de nettoyage
    try {
      const firstContact = invoiceCandidates[0]?.contact?.id ?? quoteCandidates[0]?.contact?.id ?? null;
      if (firstContact) {
        await prisma.activity.create({
          data: {
            type: 'NOTE',
            title: 'Nettoyage des données de test CRM/PayPal',
            description: `Mode: ${mode}. Soumissions archivées: ${quoteCandidates.length}. Factures traitées: ${invoiceCandidates.length}. Documents masqués: ${candidateDocuments.length}.`,
            contactId: firstContact,
          },
        });
      }
    } catch {
      // non-bloquant
    }

    // 8e. Actions PayPal si --cancel-paypal
    if (cancelPaypalFlag && paypalToken) {
      console.log('');
      console.log('→ Actions PayPal live...');

      for (const paypalId of report.paypalToDelete) {
        try {
          await deletePayPalInvoice(paypalId, paypalToken, paypalBaseUrl);
          console.log(`   ✓ Facture PayPal supprimée (DRAFT) : ${paypalId}`);
        } catch (error) {
          const msg = `Erreur delete PayPal ${paypalId}: ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(msg);
          console.error(`   ✗ ${msg}`);
        }
      }

      for (const paypalId of report.paypalToCancel) {
        try {
          await cancelPayPalInvoice(paypalId, paypalToken, paypalBaseUrl);
          console.log(`   ✓ Facture PayPal annulée (SENT) : ${paypalId}`);
        } catch (error) {
          const msg = `Erreur cancel PayPal ${paypalId}: ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(msg);
          console.error(`   ✗ ${msg}`);
        }
      }
    } else if (cancelPaypalFlag && !paypalToken) {
      report.warnings.push('--cancel-paypal demandé mais aucun access token PayPal obtenu. Actions PayPal ignorées.');
      console.warn('   ⚠️  --cancel-paypal demandé mais pas de token PayPal — ignoré.');
    }
  }

  // ── 9. Sauvegarde rapport JSON ────────────────────────────────────────────
  const reportDir = path.resolve(process.cwd(), 'cleanup-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const reportFile = path.join(reportDir, `sales-cleanup-${nowTimestamp()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');

  console.log('');
  console.log(`📄 Rapport sauvegardé : ${reportFile}`);
  console.log('');

  if (report.errors.length > 0) {
    console.log(`❌ ${report.errors.length} erreur(s) rencontrée(s) — voir le rapport JSON.`);
  } else {
    console.log('✅ Terminé sans erreur.');
  }

  console.log('');
}

run()
  .catch((error) => {
    console.error('❌ Erreur fatale :', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
