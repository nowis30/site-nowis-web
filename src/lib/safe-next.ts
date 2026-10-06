export function sanitizeNextPath(input: unknown, fallback = '/client/dashboard') {
  if (typeof input !== 'string') return fallback;
  const candidate = input.trim();
  if (!candidate.startsWith('/')) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) return fallback;
  try {
    // Inspect the pathname after ordinary decoding as well. Encoded slash and
    // backslash variants must not become an authority in a later router layer.
    let pathname = candidate.split(/[?#]/)[0];
    for (let depth = 0; depth < 3; depth++) {
      if (pathname.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(pathname)) return fallback;
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
    }
    if (pathname.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(pathname)) return fallback;
    const base = 'https://nowis.invalid';
    if (new URL(candidate, base).origin !== base) return fallback;
  } catch { return fallback; }
  return candidate;
}

export function buildAuthRedirect(path: string) {
  return `/connexion?next=${encodeURIComponent(path)}`;
}
