import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { legalConfig } from '@/data/legal';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { sanitizeEmailSubject } from '@/lib/contact-request-security';
import { PUBLIC_PROJECT_TYPES, publicInquiryOriginAllowed, readPublicInquiryBody } from '@/lib/public-inquiry-security';

export const runtime = 'nodejs';
const GROUP_TYPES = ['AINES_RESIDENCE', 'ECOLE', 'ENTREPRISE', 'COMMUNAUTAIRE', 'PRIVE', 'AUTRE'] as const;
const schema = z.object({
  name: z.string().trim().min(2).max(80).refine((v) => !/[\r\n\u0000-\u001f\u007f]/.test(v)),
  email: z.string().trim().email().max(254),
  serviceType: z.enum(PUBLIC_PROJECT_TYPES),
  message: z.string().trim().min(10).max(3000),
  groupType: z.enum(GROUP_TYPES).optional(),
  website: z.string().max(200).optional(),
  privacyAcknowledged: z.literal(true),
}).strict();
const labels = { chanson: 'Chanson', atelier: 'Atelier', video: 'Vidéo', autre: 'Autre projet' };
const digest = (value: string) => createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
const json = (body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function POST(request: NextRequest) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
    return json({ error: 'Format de demande invalide.' }, 415);
  }
  if (!publicInquiryOriginAllowed(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'Origine de la demande non autorisée.' }, 403);
  }
  let raw: unknown;
  try { raw = JSON.parse(await readPublicInquiryBody(request)); }
  catch (error) {
    return json({ error: error instanceof RangeError ? 'Message trop volumineux.' : 'Demande invalide.' }, error instanceof RangeError ? 413 : 400);
  }
  // Bots receive no personal information and never create CRM records or email.
  if (raw && typeof raw === 'object' && 'website' in raw && typeof raw.website === 'string' && raw.website.trim()) {
    return json({ ok: true });
  }
  const result = schema.safeParse(raw);
  if (!result.success) return json({ error: 'Vérifiez votre nom, votre courriel et votre message (10 à 3 000 caractères), puis la case de confidentialité.' }, 400);
  const payload = result.data;

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    // Shared database counters: survives serverless restarts. No memory-only limiter.
    for (const rule of [
      { scope: 'contact:ip' as const, identifier: 'public-inquiry:global', max: 250, windowMs: 3_600_000 },
      { scope: 'contact:ip' as const, identifier: `public:${digest(ip)}`, max: 10, windowMs: 3_600_000 },
      { scope: 'contact:user' as const, identifier: `public:${digest(payload.email)}`, max: 5, windowMs: 600_000 },
    ]) {
      const limit = await consumeContactRateLimit(rule);
      if (!limit.allowed) return json({ error: 'Trop de demandes. Réessayez plus tard ou contactez-nous directement.' }, 429, { 'Retry-After': String(limit.retryAfterSeconds) });
    }
    const message = payload.message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
    const subject = sanitizeEmailSubject(`Première demande — ${labels[payload.serviceType]} — ${payload.name}`);
    const details = [
      'DEMANDE PUBLIQUE — coordonnées déclarées, courriel non vérifié.',
      `Nom : ${payload.name}`, `Courriel : ${payload.email.toLowerCase()}`,
      `Projet : ${labels[payload.serviceType]}`,
      ...(payload.groupType ? [`Groupe : ${payload.groupType}`] : []),
      'Confidentialité : politique lue pour la prise de contact. Aucun accord de diffusion ou de marketing.',
      '', message,
    ].join('\n');
    const inquiry = await prisma.$transaction(async (tx) => {
      // Never match, update or create an authenticated contact from an unverified email.
      const created = await tx.inquiry.create({ data: {
        subject, message: details, source: 'public-inquiry', status: 'NEW', submissionStatus: 'NOUVEAU',
      }, select: { id: true } });
      await tx.task.create({ data: {
        title: `Répondre à la demande publique : ${payload.name}`,
        description: `${details}\n\nOuvrir la demande : /crm/submissions?focus=${created.id}`,
        type: 'FOLLOW_UP', status: 'TODO', priority: 'HIGH', isAutoCreated: true,
        payload: { source: 'public-inquiry', inquiryId: created.id },
      } });
      return created;
    });

    // Internal notification only. Never send auto-replies to an unverified address.
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      try {
        const transport = nodemailer.createTransport({
          host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
          connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
        });
        try {
          await transport.sendMail({
            from: process.env.SMTP_FROM || SMTP_USER,
            to: process.env.SMTP_TO || process.env.ADMIN_EMAIL || legalConfig.contactEmail,
            replyTo: payload.email, subject, text: `${details}\n\nDossier : /crm/submissions?focus=${inquiry.id}`,
          });
        } finally { transport.close(); }
      } catch (error) {
        console.warn('[PUBLIC_INQUIRY_NOTIFICATION_FAILED]', { inquiryId: inquiry.id, errorName: error instanceof Error ? error.name : 'UnknownError' });
      }
    }
    // The CRM save is the success condition, even if email delivery is unavailable.
    return json({ ok: true }, 201);
  } catch (error) {
    console.error('[PUBLIC_INQUIRY_FAILED]', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return json({ error: 'La demande n’a pas pu être enregistrée. Réessayez ou utilisez le téléphone ou le courriel.' }, 503);
  }
}
