/** Private HTML is rendered per request: never reuse a CSP nonce or cache it. */
export function privateContentSecurityPolicy(nonce: string, production = process.env.NODE_ENV === 'production') {
  if (!/^[A-Za-z0-9+/=]{20,80}$/.test(nonce)) throw new Error('INVALID_CSP_NONCE');
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://nowis-crm-files.s3.us-east-1.amazonaws.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net" + (production ? '' : ' ws://localhost:* ws://127.0.0.1:*'),
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://nowis-crm-files.s3.us-east-1.amazonaws.com https://calendar.google.com https://calendly.com",
    "frame-ancestors 'self'",
    "media-src 'self' blob: https://nowis-crm-files.s3.us-east-1.amazonaws.com",
    "worker-src 'self' blob:", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
    ...(production ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
