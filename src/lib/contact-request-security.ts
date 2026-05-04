import { z } from 'zod';

export const CONTACT_SERVICE_TYPES = ['chanson', 'video', 'atelier', 'autre'] as const;

export type ContactServiceType = (typeof CONTACT_SERVICE_TYPES)[number];

type ContactPayloadInput = {
  name: string;
  message: string;
  phone?: string;
  organization?: string;
  company?: string;
  serviceType?: ContactServiceType;
  projectType?: ContactServiceType;
  pageUrl?: string;
  source?: string;
  kind?: 'contact' | 'testimonial';
  portfolioConsent?: 'accept' | 'refuse';
  email?: string;
};

export type ContactPayload = {
  name: string;
  message: string;
  phone: string | null;
  organization: string | null;
  company: string | null;
  serviceType: ContactServiceType;
  pageUrl: string | null;
  source: string | null;
  kind: 'contact' | 'testimonial';
  portfolioConsent: 'accept' | 'refuse' | null;
};

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  const normalized = normalizeWhitespace(value)
    .replace(/[\u0000-\u001F\u007F]/g, '');
  return normalized.slice(0, maxLength);
}

export function sanitizeEmailSubject(value: unknown): string {
  if (typeof value !== 'string') return '';
  return sanitizeText(value.replace(/[\r\n]+/g, ' '), 180);
}

export function escapeHtml(value: unknown): string {
  const text = typeof value === 'string' ? value : '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isAllowedPageOrSource(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const optionalString = z.string().trim().optional();

const contactPayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(3000),
  phone: optionalString.refine((value) => !value || value.length <= 30, 'Telephone invalide'),
  organization: optionalString.refine((value) => !value || value.length <= 120, 'Organisation invalide'),
  company: optionalString.refine((value) => !value || value.length <= 120, 'Entreprise invalide'),
  serviceType: z.enum(CONTACT_SERVICE_TYPES).optional(),
  projectType: z.enum(CONTACT_SERVICE_TYPES).optional(),
  pageUrl: optionalString.refine((value) => !value || isAllowedPageOrSource(value), 'URL de page invalide'),
  source: optionalString.refine((value) => !value || isAllowedPageOrSource(value), 'Source invalide'),
  kind: z.enum(['contact', 'testimonial']).optional(),
  portfolioConsent: z.enum(['accept', 'refuse']).optional(),
  email: z.string().trim().email().max(254).optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.serviceType && !value.projectType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'serviceType est requis',
      path: ['serviceType'],
    });
  }
});

export function parseContactPayload(payload: unknown) {
  const parsed = contactPayloadSchema.safeParse(payload as ContactPayloadInput);
  if (!parsed.success) {
    return parsed;
  }

  const data = parsed.data;
  const result: ContactPayload = {
    name: sanitizeText(data.name, 80),
    message: sanitizeText(data.message, 3000),
    phone: data.phone ? sanitizeText(data.phone, 30) || null : null,
    organization: data.organization ? sanitizeText(data.organization, 120) || null : null,
    company: data.company ? sanitizeText(data.company, 120) || null : null,
    serviceType: data.serviceType ?? data.projectType ?? 'autre',
    pageUrl: data.pageUrl ? sanitizeText(data.pageUrl, 500) || null : null,
    source: data.source ? sanitizeText(data.source, 500) || null : null,
    kind: data.kind ?? 'contact',
    portfolioConsent: data.portfolioConsent ?? null,
  };

  return {
    success: true,
    data: result,
  } as const;
}

function parseUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function resolvePublicOrigin(env: NodeJS.ProcessEnv = process.env): string | null {
  const candidate = (env.NEXT_PUBLIC_SITE_URL || env.APP_URL || '').trim();
  const parsed = parseUrl(candidate);
  return parsed ? parsed.origin : null;
}

function isLocalhostOrigin(origin: string): boolean {
  const parsed = parseUrl(origin);
  if (!parsed) return false;
  return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
}

export function isAllowedOrigin(originHeader: string | null, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!originHeader) return true;

  const configuredOrigin = resolvePublicOrigin(env);
  const parsedOrigin = parseUrl(originHeader);
  if (!parsedOrigin) return false;

  if (env.NODE_ENV !== 'production' && isLocalhostOrigin(parsedOrigin.origin)) {
    return true;
  }

  if (!configuredOrigin) {
    return env.NODE_ENV !== 'production';
  }

  return parsedOrigin.origin === configuredOrigin;
}

export function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.toLowerCase().includes('application/json');
}

export type ContactRequestGuardResult =
  | { ok: true }
  | { ok: false; status: 400 | 403; error: string; code: string };

export function validateContactRequestGuards(headers: Headers, env: NodeJS.ProcessEnv = process.env): ContactRequestGuardResult {
  const contentType = headers.get('content-type');
  if (!isJsonContentType(contentType)) {
    return {
      ok: false,
      status: 400,
      error: 'Le Content-Type doit etre application/json.',
      code: 'INVALID_CONTENT_TYPE',
    };
  }

  const originHeader = headers.get('origin');
  if (!isAllowedOrigin(originHeader, env)) {
    return {
      ok: false,
      status: 403,
      error: 'Origine non autorisee pour cette operation.',
      code: 'INVALID_ORIGIN',
    };
  }

  return { ok: true };
}

export type SafeContactLog = {
  userId: string;
  contactId?: string;
  inquiryId?: string;
  messageLength: number;
  emailStatus: 'sent' | 'smtp_not_configured' | 'smtp_failed';
};

export function buildSafeContactLog(context: SafeContactLog): SafeContactLog {
  return {
    userId: sanitizeText(context.userId, 80),
    contactId: context.contactId ? sanitizeText(context.contactId, 80) : undefined,
    inquiryId: context.inquiryId ? sanitizeText(context.inquiryId, 80) : undefined,
    messageLength: context.messageLength,
    emailStatus: context.emailStatus,
  };
}