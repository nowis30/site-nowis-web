import { randomInt } from 'crypto';

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromPhone = process.env.TWILIO_FROM_PHONE?.trim();

  if (!accountSid || !authToken || !fromPhone) {
    return null;
  }

  return { accountSid, authToken, fromPhone };
}

export function getCrmOtpTargetPhone() {
  return String(process.env.CRM_OTP_PHONE || '').trim();
}

export function isCrmSmsConfigured() {
  return Boolean(getCrmOtpTargetPhone() && getTwilioConfig());
}

export function generateSmsOtpCode() {
  return String(randomInt(100000, 1000000));
}

export async function sendSmsMessage(to: string, message: string) {
  const config = getTwilioConfig();

  if (!config) {
    throw new Error('SMS provider not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE.');
  }

  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: to,
    From: config.fromPhone,
    Body: message,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    // Provider error bodies can contain submitted phone numbers and message text.
    throw new Error(`SMS delivery failed (${response.status})`);
  }

  return response.json();
}
