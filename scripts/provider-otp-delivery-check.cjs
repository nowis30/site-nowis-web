'use strict';
// Authorized one-email delivery check; deliberately separate from readonly preflight.
// Never load .env, record an auth grant, log a code/key/email/id, or retry a POST.
const { randomInt } = require('node:crypto');
const RECIPIENT = 'simonmorin@nowis.store';
const SENDER = 'CRM NOWIS <noreply@nowis.store>';
const IDEMPOTENCY_KEY = 'nowis-security-otp-delivery-20261006';
const TIMEOUT_MS = 10_000;

async function runDeliveryCheck({ argv = process.argv.slice(2), env = process.env,
  fetchImpl = globalThis.fetch, randomCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0'), timeoutMs = TIMEOUT_MS } = {}) {
  if (argv.length !== 1 || argv[0] !== '--send-authorized-test') return { status: 'not_authorized', attempted: false, accepted: false };
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'production') return { status: 'not_native_production_build', attempted: false, accepted: false };
  if (typeof env.RESEND_API_KEY !== 'string' || !env.RESEND_API_KEY.trim()) return { status: 'missing_configuration', attempted: false, accepted: false };
  let code;
  try { code = randomCode(); } catch { return { status: 'internal_error', attempted: false, accepted: false }; }
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return { status: 'internal_error', attempted: false, accepted: false };
  timeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs, TIMEOUT_MS) : TIMEOUT_MS;
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY.trim(),
            'Content-Type': 'application/json', 'Idempotency-Key': IDEMPOTENCY_KEY },
          body: JSON.stringify({ from: SENDER, to: [RECIPIENT], subject: 'NOWIS — test de livraison de sécurité (sans accès)',
            text: 'Courriel de test de livraison NOWIS autorisé pour ce contrôle de sécurité. Code de test : ' + code
              + '. Ce code ne donne aucun accès, ne crée aucune session et ne permet aucune connexion. Aucune action n’est requise.',
            html: '<p>Courriel de test de livraison NOWIS autorisé pour ce contrôle de sécurité.</p><p>Code de test : <strong>'
              + code + '</strong></p><p>Ce code ne donne aucun accès, ne crée aucune session et ne permet aucune connexion. Aucune action n’est requise.</p>',
          }),
        });
        // The API id/body is irrelevant to delivery proof and is never parsed/logged.
        if (response.body) await response.body.cancel();
        return { status: response.ok ? 'api_accepted' : response.status === 409 ? 'idempotency_conflict'
          : response.status === 429 ? 'rate_limited' : 'provider_rejected', attempted: true, accepted: response.ok === true };
      })(),
      new Promise(resolve => { timer = setTimeout(() => { controller.abort();
        resolve({ status: 'timeout', attempted: true, accepted: false });
      }, timeoutMs); }),
    ]);
  } catch {
    return { status: controller.signal.aborted ? 'timeout' : 'provider_error', attempted: true, accepted: false };
  } finally { clearTimeout(timer); }
}

module.exports = { runDeliveryCheck };
if (require.main === module) {
  runDeliveryCheck().then(report => { process.stdout.write(JSON.stringify(report) + '\n'); process.exitCode = report.accepted ? 0 : 1; },
    () => { process.stdout.write(JSON.stringify({ status: 'internal_error', attempted: false, accepted: false }) + '\n'); process.exitCode = 1; });
}

