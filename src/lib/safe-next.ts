export function sanitizeNextPath(input: unknown, fallback = '/client/dashboard') {
  if (typeof input !== 'string') return fallback;
  const candidate = input.trim();
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//')) return fallback;
  if (candidate.startsWith('/\\')) return fallback;
  return candidate;
}

export function buildAuthRedirect(path: string) {
  return `/connexion?next=${encodeURIComponent(path)}`;
}
