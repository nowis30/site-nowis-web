export const SITE_AUDIENCE_WINDOW_SECONDS = 180 as const;
export const SITE_AUDIENCE_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export type SiteAudienceScope = 'site' | 'local' | 'preview';

export type SiteAudienceSnapshot = {
  totalVisits: number;
  online: number;
  startedAt: string;
  windowSeconds: typeof SITE_AUDIENCE_WINDOW_SECONDS;
  scope: SiteAudienceScope;
};

export type SiteAudienceState = {
  totalVisits: number;
  startedAt: string;
  sessions: Record<string, number>;
};

export type SiteAudienceFile = {
  version: 1;
  namespaces: Record<string, SiteAudienceState>;
};

export function createSiteAudienceState(now: number): SiteAudienceState {
  return { totalVisits: 0, startedAt: new Date(now).toISOString(), sessions: {} };
}

export function pruneSiteAudienceSessions(state: SiteAudienceState, now: number): SiteAudienceState {
  const cutoff = now - SITE_AUDIENCE_SESSION_TIMEOUT_MS;
  return { ...state, sessions: Object.fromEntries(Object.entries(state.sessions).filter(([, seen]) => seen > cutoff)) };
}

export function recordSiteAudienceSession(state: SiteAudienceState, sessionHash: string, now: number): SiteAudienceState {
  const next = pruneSiteAudienceSessions(state, now);
  const previous = next.sessions[sessionHash];
  const totalVisits = next.totalVisits + (previous === undefined ? 1 : 0);
  if (!Number.isSafeInteger(totalVisits)) throw new Error('Audience counter exceeds the JSON integer range.');
  return { ...next, totalVisits, sessions: { ...next.sessions, [sessionHash]: Math.max(previous ?? now, now) } };
}

export function siteAudienceSnapshot(state: SiteAudienceState, now: number, scope: SiteAudienceScope): SiteAudienceSnapshot {
  const cutoff = now - SITE_AUDIENCE_WINDOW_SECONDS * 1000;
  return {
    totalVisits: state.totalVisits,
    online: Object.values(state.sessions).filter((lastSeen) => lastSeen > cutoff).length,
    startedAt: state.startedAt,
    windowSeconds: SITE_AUDIENCE_WINDOW_SECONDS,
    scope,
  };
}

/** A damaged local file must fail visibly, never reset a real count to zero. */
export function parseSiteAudienceFile(value: unknown): SiteAudienceFile {
  if (!value || typeof value !== 'object') throw new Error('Invalid audience file.');
  const file = value as Partial<SiteAudienceFile>;
  if (file.version !== 1 || !file.namespaces || typeof file.namespaces !== 'object' || Array.isArray(file.namespaces)) {
    throw new Error('Invalid audience file.');
  }
  for (const [namespace, state] of Object.entries(file.namespaces)) {
    if (!namespace || namespace.length > 128 || !state || typeof state !== 'object'
      || !Number.isSafeInteger(state.totalVisits) || state.totalVisits < 0
      || typeof state.startedAt !== 'string' || !Number.isFinite(Date.parse(state.startedAt))
      || !state.sessions || typeof state.sessions !== 'object' || Array.isArray(state.sessions)) {
      throw new Error('Invalid audience namespace.');
    }
    for (const [hash, lastSeen] of Object.entries(state.sessions)) {
      if (!/^[a-f0-9]{64}$/.test(hash) || !Number.isSafeInteger(lastSeen) || lastSeen < 0) {
        throw new Error('Invalid audience session.');
      }
    }
  }
  return file as SiteAudienceFile;
}
