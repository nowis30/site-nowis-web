const publicDevelopmentSecrets = new Set([
  'change-me-in-production', 'dev-only-secret-must-change-before-prod',
  'dev-only-portal-secret-must-change', 'change-me-before-production', 'your-secret-key',
  'dev-calendar-token-encryption-key-change-me',
]);

/** Missing, short or published development signing keys are deployment errors,
 * never reasons to select a public fallback. Error text contains no key. */
export function getAuthSigningSecret(names: string[], developmentFallback: string): string {
  const configured = names.map(name => process.env[name]?.trim()).find(Boolean);
  if (process.env.NODE_ENV === 'production') {
    if (!configured || Buffer.byteLength(configured, 'utf8') < 32 || publicDevelopmentSecrets.has(configured)) {
      throw new Error(`Configuration de signature invalide: ${names.join(' ou ')} nécessite un secret privé d’au moins 32 octets.`);
    }
    return configured;
  }
  return configured || developmentFallback;
}
