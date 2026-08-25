import { prisma } from '@/lib/prisma';
import { decryptCalendarToken, encryptCalendarToken } from '@/lib/calendar/token-crypto';
import { buildInvoicePdfBuffer } from '@/lib/invoice-pdf';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot } from '@/lib/billing-profile';
import { buildPublicInvoiceUrl, signCompactPublicInvoiceToken } from '@/lib/public-links';

const OUTLOOK_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'User.Read',
  'Mail.ReadWrite',
];

export class OutlookNotConnectedError extends Error {
  constructor() {
    super('Outlook n’est pas encore connecté au CRM.');
    this.name = 'OutlookNotConnectedError';
  }
}

export class OutlookConfigurationError extends Error {
  constructor(message = 'Configuration Microsoft Outlook manquante sur le serveur.') {
    super(message);
    this.name = 'OutlookConfigurationError';
  }
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '');
}

function getTenantId() {
  return process.env.MICROSOFT_TENANT_ID?.trim() || 'common';
}

export function getOutlookOAuthConfig(origin: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID?.trim();
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new OutlookConfigurationError(
      'MICROSOFT_CLIENT_ID et MICROSOFT_CLIENT_SECRET doivent être configurés pour connecter Outlook.',
    );
  }

  const redirectUri =
    process.env.MICROSOFT_OUTLOOK_REDIRECT_URI?.trim() ||
    `${normalizeOrigin(origin)}/api/crm/outlook/callback`;
  const tenantId = getTenantId();

  return {
    clientId,
    clientSecret,
    redirectUri,
    authorizeUrl: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    scopes: OUTLOOK_SCOPES,
  };
}

export function buildOutlookAuthorizationUrl(origin: string, state: string) {
  const config = getOutlookOAuthConfig(origin);
  const url = new URL(config.authorizeUrl);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

async function parseMicrosoftError(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as {
      error_description?: string;
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === 'object' && parsed.error?.message) return parsed.error.message;
    if (typeof parsed.error === 'string') return parsed.error_description || parsed.error;
    return parsed.error_description || parsed.message || text;
  } catch {
    return text;
  }
}

export async function connectOutlookFromAuthorizationCode(origin: string, code: string, createdByUserId: string) {
  const config = getOutlookOAuthConfig(origin);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!tokenResponse.ok) {
    throw new Error(await parseMicrosoftError(tokenResponse));
  }

  const tokens = await tokenResponse.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!tokens.access_token) throw new Error('Microsoft n’a pas retourné de jeton d’accès.');

  const profileResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName',
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    },
  );
  if (!profileResponse.ok) throw new Error(await parseMicrosoftError(profileResponse));

  const profile = await profileResponse.json() as {
    id?: string;
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
  };
  if (!profile.id) throw new Error('Profil Microsoft invalide.');

  const accountEmail = (profile.mail || profile.userPrincipalName || '').trim() || null;
  const expiresAt = typeof tokens.expires_in === 'number'
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  return prisma.calendarConnection.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'MICROSOFT',
        providerAccountId: profile.id,
      },
    },
    create: {
      provider: 'MICROSOFT',
      providerAccountId: profile.id,
      accountEmail,
      accountName: profile.displayName?.trim() || null,
      accessTokenEncrypted: encryptCalendarToken(tokens.access_token),
      refreshTokenEncrypted: encryptCalendarToken(tokens.refresh_token),
      expiresAt,
      scopes: tokens.scope ? tokens.scope.split(/\s+/).filter(Boolean) : config.scopes,
      status: 'CONNECTED',
      createdByUserId,
      lastError: null,
    },
    update: {
      accountEmail,
      accountName: profile.displayName?.trim() || null,
      accessTokenEncrypted: encryptCalendarToken(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token ? encryptCalendarToken(tokens.refresh_token) : undefined,
      expiresAt,
      scopes: tokens.scope ? tokens.scope.split(/\s+/).filter(Boolean) : config.scopes,
      status: 'CONNECTED',
      createdByUserId,
      lastError: null,
    },
  });
}

async function refreshOutlookAccessToken(origin: string, connection: {
  id: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string[];
}) {
  const refreshToken = decryptCalendarToken(connection.refreshTokenEncrypted);
  if (!refreshToken) throw new OutlookNotConnectedError();

  const config = getOutlookOAuthConfig(origin);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!response.ok) {
    const message = await parseMicrosoftError(response);
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: { status: 'EXPIRED', lastError: message.slice(0, 1000) },
    }).catch(() => undefined);
    throw new Error(message);
  }

  const data = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!data.access_token) throw new Error('Microsoft n’a pas retourné de nouveau jeton d’accès.');

  const nextRefreshToken = data.refresh_token || refreshToken;
  const updated = await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptCalendarToken(data.access_token),
      refreshTokenEncrypted: encryptCalendarToken(nextRefreshToken),
      expiresAt: typeof data.expires_in === 'number'
        ? new Date(Date.now() + data.expires_in * 1000)
        : connection.expiresAt,
      scopes: data.scope ? data.scope.split(/\s+/).filter(Boolean) : connection.scopes,
      status: 'CONNECTED',
      lastError: null,
    },
  });

  return decryptCalendarToken(updated.accessTokenEncrypted)!;
}

export async function getConnectedOutlookAccount() {
  return prisma.calendarConnection.findFirst({
    where: {
      provider: 'MICROSOFT',
      status: { in: ['CONNECTED', 'ERROR', 'EXPIRED'] },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function getValidOutlookAccessToken(origin: string, connection: NonNullable<Awaited<ReturnType<typeof getConnectedOutlookAccount>>>) {
  const token = decryptCalendarToken(connection.accessTokenEncrypted);
  const expiresSoon = connection.expiresAt && connection.expiresAt.getTime() <= Date.now() + 120_000;
  if (token && !expiresSoon) return token;
  return refreshOutlookAccessToken(origin, connection);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(value));
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

export async function createInvoiceOutlookDraft(invoiceId: string, origin: string) {
  const connection = await getConnectedOutlookAccount();
  if (!connection) throw new OutlookNotConnectedError();

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

  const connectedEmail = connection.accountEmail?.trim();
  if (connectedEmail && connectedEmail.toLowerCase() !== senderEmail.toLowerCase()) {
    throw new Error(
      `Le compte Outlook connecté est ${connectedEmail}. Connecte ${senderEmail} pour envoyer cette facture avec la bonne adresse.`,
    );
  }

  const invoiceToken = signCompactPublicInvoiceToken({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    contactId: invoice.contact.id,
  });
  const invoiceUrl = buildPublicInvoiceUrl(invoiceToken, normalizeOrigin(origin));
  const subject = `Facture ${invoice.number} | ${businessProfile.displayName}`;

  const invoicePdf = await buildInvoicePdfBuffer(
    {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: invoice.amount.toString(),
      description: invoice.description,
      contact: {
        fullName: customerProfile.fullName,
        email: customerProfile.email,
        companyName: customerProfile.companyName,
        addressLine1: customerProfile.addressLine1,
        addressLine2: customerProfile.addressLine2,
        city: customerProfile.city,
        state: customerProfile.state,
        postalCode: customerProfile.postalCode,
        country: customerProfile.country,
        taxId: customerProfile.taxId,
      },
    },
    businessProfile,
  );

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;line-height:1.6">
      <p>Bonjour ${escapeHtml(customerProfile.fullName)},</p>
      <p>Veuillez trouver ci-joint la facture <strong>${escapeHtml(invoice.number)}</strong>.</p>
      <table style="border-collapse:collapse;margin:20px 0;width:100%;max-width:460px">
        <tr><td style="padding:8px 0;color:#64748b">Montant dû</td><td style="padding:8px 0;text-align:right;font-weight:700">${escapeHtml(formatMoney(invoice.amount.toString()))}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Date d’échéance</td><td style="padding:8px 0;text-align:right">${escapeHtml(formatDate(invoice.dueDate))}</td></tr>
      </table>
      <p><a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Consulter la facture en ligne</a></p>
      <p style="margin-top:24px"><strong>Mode de paiement</strong><br/>Virement Interac : ${escapeHtml(senderEmail)}</p>
      <p style="margin-top:28px">Merci,<br/><strong>${escapeHtml(businessProfile.displayName)}</strong><br/>${escapeHtml(senderEmail)}<br/>${escapeHtml(businessProfile.website || 'nowis.store')}</p>
    </div>
  `;

  const accessToken = await getValidOutlookAccessToken(normalizeOrigin(origin), connection);
  const response = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: recipientEmail, name: customerProfile.fullName } }],
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: `facture-${invoice.number}.pdf`,
          contentType: 'application/pdf',
          contentBytes: invoicePdf.toString('base64'),
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await parseMicrosoftError(response);
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: { status: 'ERROR', lastError: message.slice(0, 1000) },
    }).catch(() => undefined);
    throw new Error(message);
  }

  const draft = await response.json() as { id?: string; webLink?: string };
  if (!draft.id) throw new Error('Outlook a créé un brouillon invalide.');

  let outlookOrigin = 'https://outlook.office.com';
  if (draft.webLink) {
    try {
      outlookOrigin = new URL(draft.webLink).origin;
    } catch {
      // Garde le domaine Outlook professionnel par défaut.
    }
  }
  const outlookUrl = `${outlookOrigin}/mail/deeplink/compose?itemid=${encodeURIComponent(draft.id)}&exvsurl=1`;

  return {
    outlookUrl,
    draftId: draft.id,
    invoiceUrl,
    recipientEmail,
    senderEmail,
    pdfAttached: true,
    connectedEmail: connection.accountEmail,
  };
}
