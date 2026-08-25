import { prisma } from '@/lib/prisma';
import { decryptCalendarToken } from '@/lib/calendar/token-crypto';
import {
  buildCustomerSnapshotFromContact,
  getBillingIssuerSnapshot,
  toCustomerSnapshot,
  toIssuerSnapshot,
} from '@/lib/billing-profile';
import { parseInvoiceDescriptionLines } from '@/lib/invoice-lines';
import {
  createInvoiceOutlookDraft,
  getConnectedOutlookAccount,
} from '@/lib/outlook/service';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

async function parseMicrosoftError(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === 'object' && parsed.error?.message) return parsed.error.message;
    if (typeof parsed.error === 'string') return parsed.error;
    return parsed.message || text;
  } catch {
    return text;
  }
}

export async function createInvoiceOutlookDraftWithFullInvoice(invoiceId: string, origin: string) {
  // Le service existant crée le brouillon, rafraîchit le jeton Microsoft au besoin
  // et joint déjà le PDF. On remplace ensuite le corps du brouillon par la facture complète.
  const baseDraft = await createInvoiceOutlookDraft(invoiceId, origin);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          companyName: true,
          billingCompanyName: true,
          billingLegalName: true,
          billingEmail: true,
          billingPhone: true,
          billingAddressLine1: true,
          billingAddressLine2: true,
          billingCity: true,
          billingState: true,
          billingPostalCode: true,
          billingCountry: true,
          billingTaxId: true,
          billingNotes: true,
        },
      },
    },
  });

  if (!invoice) throw new Error('Facture introuvable.');

  const businessProfile = toIssuerSnapshot(invoice.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customerProfile = toCustomerSnapshot(invoice.customerSnapshot) || buildCustomerSnapshotFromContact(invoice.contact);
  const recipientEmail = customerProfile.email || invoice.contact.email;
  const senderEmail = businessProfile.email?.trim();

  if (!recipientEmail) throw new Error('Aucune adresse courriel n’est configurée pour le destinataire.');
  if (!senderEmail) throw new Error('L’adresse courriel de facturation du CRM est manquante.');

  const lines = parseInvoiceDescriptionLines(invoice.description, invoice.amount.toString());
  const rows = lines
    .map((line) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top">${escapeHtml(line.description)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;vertical-align:top">${line.amount !== null ? escapeHtml(formatMoney(line.amount)) : '—'}</td>
      </tr>
    `)
    .join('');

  const billedTo = [
    customerProfile.companyName,
    customerProfile.fullName,
    customerProfile.addressLine1,
    customerProfile.addressLine2,
    [customerProfile.city, customerProfile.state, customerProfile.postalCode].filter(Boolean).join(', '),
    customerProfile.country,
  ].filter(Boolean) as string[];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;line-height:1.55">
      <p>Bonjour ${escapeHtml(customerProfile.fullName)},</p>
      <p>Voici le détail de la facture <strong>${escapeHtml(invoice.number)}</strong>. Le document officiel est également joint en PDF à ce courriel.</p>

      <div style="margin:24px 0;padding:20px;border:1px solid #cbd5e1;border-radius:10px;background:#ffffff">
        <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
          <tr>
            <td style="vertical-align:top">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Facture</div>
              <div style="font-size:24px;font-weight:700;margin-top:3px">${escapeHtml(invoice.number)}</div>
            </td>
            <td style="vertical-align:top;text-align:right;font-size:13px">
              <div><strong>Date :</strong> ${escapeHtml(formatDate(invoice.issueDate))}</div>
              <div><strong>Échéance :</strong> ${escapeHtml(formatDate(invoice.dueDate))}</div>
            </td>
          </tr>
        </table>

        <div style="margin-bottom:18px">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px">Facturé à</div>
          ${billedTo.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr>
              <th style="padding:9px 8px;text-align:left;border-bottom:2px solid #94a3b8">Description</th>
              <th style="padding:9px 8px;text-align:right;border-bottom:2px solid #94a3b8">Montant</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td style="padding:14px 8px 4px;text-align:right;font-weight:700">TOTAL</td>
              <td style="padding:14px 8px 4px;text-align:right;font-size:18px;font-weight:700;white-space:nowrap">${escapeHtml(formatMoney(invoice.amount.toString()))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p><strong>Mode de paiement</strong><br/>Virement Interac : ${escapeHtml(senderEmail)}</p>
      <p style="color:#475569;font-size:13px">Pièce jointe : <strong>facture-${escapeHtml(invoice.number)}.pdf</strong></p>
      <p style="margin-top:28px">Merci,<br/><strong>${escapeHtml(businessProfile.displayName)}</strong><br/>${escapeHtml(senderEmail)}<br/>${escapeHtml(businessProfile.website || 'nowis.store')}</p>
    </div>
  `;

  const connection = await getConnectedOutlookAccount();
  const accessToken = connection ? decryptCalendarToken(connection.accessTokenEncrypted) : null;
  if (!connection || !accessToken) {
    throw new Error('La connexion Outlook n’est plus disponible. Reconnecte Outlook et réessaie.');
  }

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(baseDraft.draftId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: `Facture ${invoice.number} | ${businessProfile.displayName}`,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: recipientEmail, name: customerProfile.fullName } }],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await parseMicrosoftError(response);
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(baseDraft.draftId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }).catch(() => undefined);
    throw new Error(`Impossible de finaliser le brouillon Outlook : ${message}`);
  }

  return {
    outlookUrl: baseDraft.outlookUrl,
    draftId: baseDraft.draftId,
    recipientEmail,
    senderEmail,
    pdfAttached: true,
    connectedEmail: connection.accountEmail,
  };
}
