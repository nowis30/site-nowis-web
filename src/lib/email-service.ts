import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  reactComponent?: React.ReactNode;
  html?: string;
  attachments?: Array<{
    filename: string;
    contentBase64: string;
  }>;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY non configurée');
      return { success: false, error: 'Email API not configured' };
    }

    const response = await resend.emails.send({
      from: 'CRM NOWIS <noreply@nowis.store>',
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.html || '<p>Message email</p>',
      attachments: payload.attachments?.map((file) => ({
        filename: file.filename,
        content: file.contentBase64,
      })),
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Email envoyé:', response.data?.id);
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendCaseCreatedEmail(caseTitle: string, recipient: string, referenceCode: string) {
  return sendEmail({
    to: recipient,
    subject: `Nouveau dossier créé : ${caseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nouveau dossier</h2>
        <p>Un nouveau dossier a été créé :</p>
        <ul>
          <li><strong>Titre :</strong> ${caseTitle}</li>
          <li><strong>Référence :</strong> ${referenceCode}</li>
        </ul>
        <p><a href="https://app.nowis.store/crm/cases" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Voir le dossier</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">CRM NOWIS</p>
      </div>
    `,
  });
}

export async function sendMaintenanceAlertEmail(title: string, recipient: string, priority: string) {
  const priorityColor = {
    LOW: '#3b82f6',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    URGENT: '#991b1b',
  }[priority] || '#6b7280';

  return sendEmail({
    to: recipient,
    subject: `⚠️ Maintenance urgente : ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColor}; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px;">Ticket de maintenance</h2>
          <p style="margin: 5px 0 0 0;">Priorité: <strong>${priority}</strong></p>
        </div>
        <p><strong>${title}</strong></p>
        <p><a href="https://app.nowis.store/crm/maintenance" style="background: ${priorityColor}; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Voir les détails</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">CRM NOWIS</p>
      </div>
    `,
  });
}

function getCrmNotificationRecipient() {
  return (
    process.env.CRM_NOTIFICATION_EMAIL ||
    process.env.COMPANY_EMAIL ||
    process.env.BOOKING_EMAIL ||
    'simonmorin@nowis.store'
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendPortalEventNotificationEmail(options: {
  eventLabel: string;
  subject: string;
  headline: string;
  lines: Array<string | null | undefined>;
}) {
  const recipient = getCrmNotificationRecipient();
  const linesHtml = options.lines
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(String(line))}</li>`)
    .join('');

  return sendEmail({
    to: recipient,
    subject: options.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">${escapeHtml(options.eventLabel)}</p>
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #0f172a;">${escapeHtml(options.headline)}</h2>
        <ul style="padding-left: 18px; color: #334155; line-height: 1.6;">
          ${linesHtml}
        </ul>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6b7280;">CRM NOWIS</p>
      </div>
    `,
  });
}
