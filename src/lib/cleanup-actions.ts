/**
 * Logique partagée pour les actions de nettoyage CRM :
 * mark-test, archive, restore, delete-permanent.
 *
 * Protections :
 * - Une facture PAID / SENT en live ne peut jamais être supprimée définitivement.
 * - Seul un ADMIN peut supprimer définitivement.
 * - Toute action crée une activité d'audit.
 */

import { prisma } from '@/lib/prisma';

export type CleanupModule =
  | 'SONG_REQUEST'
  | 'WORKSHOP_REQUEST'
  | 'SUBMISSION'
  | 'INVOICE';

// ─── Vérification de protection pour les factures ─────────────────────────────

export interface InvoiceSafetyResult {
  canDelete: boolean;
  reason?: string;
}

export function checkInvoiceDeletable(invoice: {
  status: string;
  paypalStatus?: string | null;
  paypalInvoiceId?: string | null;
  paymentReceivedAt?: Date | null;
  paypalPaidAt?: Date | null;
}): InvoiceSafetyResult {
  const isLive = process.env.PAYPAL_ENV === 'live';

  if (invoice.status === 'PAID') {
    return { canDelete: false, reason: 'Facture déjà payée — suppression définitive interdite.' };
  }
  if (invoice.status === 'SENT' && isLive) {
    return { canDelete: false, reason: 'Facture envoyée en production — suppression définitive interdite.' };
  }
  if (invoice.paypalStatus === 'PAID') {
    return { canDelete: false, reason: 'Paiement PayPal confirmé — suppression définitive interdite.' };
  }
  if (isLive && invoice.paypalInvoiceId) {
    return { canDelete: false, reason: 'Facture liée à un ID PayPal en mode production — suppression définitive interdite.' };
  }
  if (invoice.paypalPaidAt) {
    return { canDelete: false, reason: 'Paiement PayPal enregistré — suppression définitive interdite.' };
  }

  return { canDelete: true };
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function logCleanupActivity(opts: {
  action: 'MARK_TEST' | 'ARCHIVE' | 'RESTORE' | 'DELETE_PERMANENT';
  module: CleanupModule;
  itemId: string;
  itemLabel: string;
  userId: string;
  reason?: string;
  contactId?: string | null;
}) {
  const labels: Record<typeof opts.action, string> = {
    MARK_TEST: 'Marqué comme test',
    ARCHIVE: 'Archivé',
    RESTORE: 'Restauré',
    DELETE_PERMANENT: 'Supprimé définitivement',
  };

  await prisma.activity
    .create({
      data: {
        type: 'NOTE',
        title: `[Cleanup] ${labels[opts.action]} — ${opts.module}`,
        description: [
          `"${opts.itemLabel}"`,
          opts.reason ? `Raison : ${opts.reason}` : null,
          `Module : ${opts.module}`,
          `ID : ${opts.itemId}`,
        ]
          .filter(Boolean)
          .join(' | '),
        relatedType: opts.module,
        relatedId: opts.action === 'DELETE_PERMANENT' ? undefined : opts.itemId,
        userId: opts.userId,
        contactId: opts.contactId ?? null,
      },
    })
    .catch(() => undefined); // ne jamais bloquer sur l'audit
}

// ─── Filtre WHERE Prisma selon le paramètre `view` ────────────────────────────

export type CleanupView = 'active' | 'archived' | 'test' | 'trash' | 'all';

/**
 * Retourne les conditions Prisma WHERE selon la vue demandée.
 * Par défaut (active) : exclut isTest, archivedAt non null, deletedAt non null.
 * Réservé aux admins pour 'all' et 'trash'.
 */
export function buildCleanupWhere(view: CleanupView | undefined, isAdmin: boolean) {
  const v = view ?? 'active';

  if (v === 'all' && !isAdmin) return null; // refusé si non admin
  if (v === 'trash' && !isAdmin) return null;

  switch (v) {
    case 'active':
      return {
        isTest: false,
        archivedAt: null,
        deletedAt: null,
      };
    case 'archived':
      return {
        archivedAt: { not: null },
        deletedAt: null,
      };
    case 'test':
      return {
        isTest: true,
        deletedAt: null,
      };
    case 'trash':
      return {
        deletedAt: { not: null },
      };
    case 'all':
      return {}; // aucun filtre
    default:
      return {
        isTest: false,
        archivedAt: null,
        deletedAt: null,
      };
  }
}
