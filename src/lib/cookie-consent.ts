/** Version 2 intentionally ignores the former “J’ai compris” acknowledgement. */
export const COOKIE_CONSENT_KEY = 'nowis_cookie_consent_v2';
export const COOKIE_CONSENT_EVENT = 'nowis:cookie-consent';
export type CookieConsent = { version: 2; analytics: boolean; advertising: boolean; decidedAt: number };
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
let volatileConsent: CookieConsent | null = null;

export function parseCookieConsent(raw: string | null, now = Date.now()): CookieConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 2 || typeof value.analytics !== 'boolean' || typeof value.advertising !== 'boolean'
      || typeof value.decidedAt !== 'number' || !Number.isFinite(value.decidedAt)
      || value.decidedAt > now || now - value.decidedAt > MAX_AGE_MS) return null;
    return { version: 2, analytics: value.analytics, advertising: value.advertising, decidedAt: value.decidedAt };
  } catch { return null; }
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  if (volatileConsent) return volatileConsent;
  try { return parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY)); } catch { return null; }
}

function removeGoogleCookies() {
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = ['', host, ...parts.slice(1, -1).map((_, index) => parts.slice(index + 1).join('.'))];
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (!name || !/^_(ga(?:_|$)|gid(?:_|$)|gat|gcl_)/.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

export function saveCookieConsent(choice: Pick<CookieConsent, 'analytics' | 'advertising'>) {
  const previous = readCookieConsent();
  const next: CookieConsent = { ...choice, version: 2, decidedAt: Date.now() };
  volatileConsent = next;
  try { window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next)); volatileConsent = null; } catch { /* Session-only choice when storage is blocked. */ }
  const revoked = (previous?.analytics && !next.analytics) || (previous?.advertising && !next.advertising);
  if (revoked) {
    // A script already executed cannot be unloaded by removing its DOM element.
    // Reload after persisting the new choice; the next document starts blocked.
    window.gtag?.('consent', 'update', {
      analytics_storage: next.analytics ? 'granted' : 'denied',
      ad_storage: next.advertising ? 'granted' : 'denied',
      ad_user_data: next.advertising ? 'granted' : 'denied',
      ad_personalization: next.advertising ? 'granted' : 'denied',
    });
    removeGoogleCookies();
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
  if (revoked) window.location.reload();
}
