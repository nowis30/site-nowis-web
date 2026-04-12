const DEFAULT_API_ORIGIN = 'https://api.nowis.store';

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getPublicApiOrigin() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_API_ORIGIN;
  }

  if (typeof window !== 'undefined') {
    return trimTrailingSlash(window.location.origin);
  }

  return '';
}

export function toPublicApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const origin = getPublicApiOrigin();

  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}
