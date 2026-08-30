import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email-service';

export const runtime = 'nodejs';

const feedbackSchema = z.object({
  idea: z.string().trim().min(10).max(2000),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  pathname: z.string().trim().max(200).optional(),
  website: z.string().max(0).optional(),
});

type RateEntry = { count: number; resetAt: number };
const globalRateStore = globalThis as typeof globalThis & { __nowisFeedbackRate?: Map<string, RateEntry> };
const rateStore = globalRateStore.__nowisFeedbackRate || new Map<string, RateEntry>();
globalRateStore.__nowisFeedbackRate = rateStore;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'anonymous';
}

function isRateLimited(key: string) {
  const now = Date.now();
  const existing = rateStore.get(key);
  if (!existing || existing.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (existing.count >= 5) return true;
  existing.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    const parsed = feedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Suggestion invalide.' }, { status: 400 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    const key = getClientKey(request);
    if (isRateLimited(key)) {
      return NextResponse.json({ error: 'Trop de suggestions. Réessayez plus tard.' }, { status: 429 });
    }

    const recipient =
      process.env.SITE_FEEDBACK_EMAIL?.trim() ||
      process.env.CRM_NOTIFICATION_EMAIL?.trim() ||
      process.env.COMPANY_EMAIL?.trim() ||
      process.env.BOOKING_EMAIL?.trim() ||
      'simonmorin@nowis.store';

    const idea = escapeHtml(parsed.data.idea);
    const visitorEmail = parsed.data.email ? escapeHtml(parsed.data.email) : 'Non fourni';
    const pathname = escapeHtml(parsed.data.pathname || '/');
    const userAgent = escapeHtml(request.headers.get('user-agent')?.slice(0, 300) || 'Non disponible');
    const submittedAt = new Date().toISOString();

    const result = await sendEmail({
      to: recipient,
      subject: '💡 Nouvelle idée d’amélioration du site NOWIS',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1f2937">
          <div style="padding:18px 20px;border-radius:16px;background:#2f241d;color:#fff">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;opacity:.72">Assistant NOWIS</div>
            <h2 style="margin:6px 0 0;font-size:22px">Nouvelle idée d’amélioration</h2>
          </div>
          <div style="margin-top:18px;padding:18px 20px;border:1px solid #eadbc9;border-radius:16px;background:#fffaf5">
            <p style="margin:0;white-space:pre-wrap;line-height:1.6">${idea}</p>
          </div>
          <table style="margin-top:18px;width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:7px 0;color:#6b7280">Courriel du visiteur</td><td style="padding:7px 0;font-weight:600">${visitorEmail}</td></tr>
            <tr><td style="padding:7px 0;color:#6b7280">Page d’origine</td><td style="padding:7px 0;font-weight:600">${pathname}</td></tr>
            <tr><td style="padding:7px 0;color:#6b7280">Date UTC</td><td style="padding:7px 0">${submittedAt}</td></tr>
            <tr><td style="padding:7px 0;color:#6b7280">Navigateur</td><td style="padding:7px 0">${userAgent}</td></tr>
          </table>
          <p style="margin-top:20px;font-size:12px;color:#6b7280">Suggestion transmise depuis le module « Mon idée » du site NOWIS.</p>
        </div>
      `,
    });

    if (!result.success) {
      console.error('Site feedback email failed:', result.error);
      return NextResponse.json({ error: 'Courriel non disponible.' }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Site feedback error:', error);
    return NextResponse.json({ error: 'Impossible d’envoyer la suggestion.' }, { status: 500 });
  }
}
