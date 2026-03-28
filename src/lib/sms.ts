function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_FROM_PHONE;

  if (!accountSid || !authToken || !fromPhone) {
    return null;
  }

  return { accountSid, authToken, fromPhone };
}

export function getCrmOtpTargetPhone() {
  return String(process.env.CRM_OTP_PHONE || '').trim();
}

export function generateSmsOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
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
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Twilio send failed (${response.status}): ${details}`);
  }

  return response.json();
}
