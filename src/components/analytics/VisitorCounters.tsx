'use client';

import { useEffect, useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCookieConsent } from '@/components/privacy/useCookieConsent';
import { readCookieConsent } from '@/lib/cookie-consent';

const SESSION_KEY = 'nowis_site_audience_session_v1';
const SESSION_IDLE_MS = 30 * 60 * 1000;
const REFRESH_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 12 * 1000;
const SESSION_LOCK = 'nowis-site-audience-session';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const numberFormat = new Intl.NumberFormat('fr-CA');
const dateFormat = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeZone: 'America/Toronto' });

type Audience = {
  totalVisits: number;
  online: number;
  startedAt: string;
  windowSeconds: 180;
  scope: 'site' | 'local' | 'preview';
};

type CounterState =
  | { status: 'loading'; audience: null }
  | { status: 'available'; audience: Audience }
  | { status: 'unavailable'; audience: null };

function parseAudience(value: unknown): Audience | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Audience>;
  if (typeof item.totalVisits !== 'number' || !Number.isSafeInteger(item.totalVisits) || item.totalVisits < 0
    || typeof item.online !== 'number' || !Number.isSafeInteger(item.online) || item.online < 0
    || typeof item.startedAt !== 'string' || !Number.isFinite(Date.parse(item.startedAt))
    || item.windowSeconds !== 180 || !['site', 'local', 'preview'].includes(item.scope || '')) return null;
  return item as Audience;
}

function clearAudienceSession() {
  try { window.localStorage.removeItem(SESSION_KEY); } catch { /* Optional audience storage. */ }
}

async function fetchAudience(signal: AbortSignal, sessionId?: string): Promise<Audience> {
  const request = new AbortController();
  const abort = () => request.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = window.setTimeout(abort, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api/site-audience', {
      method: sessionId ? 'POST' : 'GET', cache: 'no-store', signal: request.signal,
      ...(sessionId ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, analyticsConsent: true }),
      } : {}),
    });
    if (!response.ok) throw new Error('Audience unavailable');
    const audience = parseAudience(await response.json());
    if (!audience) throw new Error('Invalid audience response');
    return audience;
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

async function activeSessionId(signal: AbortSignal): Promise<string | null> {
  const readOrCreate = (allowCreation: boolean) => {
    if (signal.aborted || !readCookieConsent()?.analytics || document.visibilityState !== 'visible') return null;
    try {
      const now = Date.now();
      const raw = window.localStorage.getItem(SESSION_KEY);
      let saved: { sessionId?: unknown; lastActivityAt?: unknown } | null = null;
      try { saved = raw ? JSON.parse(raw) : null; } catch { /* Replace malformed optional storage. */ }
      const recent = typeof saved?.lastActivityAt === 'number' && Number.isFinite(saved.lastActivityAt)
        && saved.lastActivityAt <= now && now - saved.lastActivityAt < SESSION_IDLE_MS;
      const existingId = recent && typeof saved?.sessionId === 'string' && uuidPattern.test(saved.sessionId)
        ? saved.sessionId : null;
      // A browser without cross-tab locking may reuse an existing session,
      // but must not race another tab to create two visits.
      if (!existingId && !allowCreation) return null;
      const sessionId = existingId ?? window.crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, lastActivityAt: now }));
      return sessionId;
    } catch {
      // Without usable shared storage, do not create a different visit per tab.
      return null;
    }
  };
  if (navigator.locks?.request) {
    return navigator.locks.request(SESSION_LOCK, { mode: 'exclusive', signal }, () => readOrCreate(true));
  }
  return readOrCreate(false);
}

function audienceDescription(audience: Audience | null, status: CounterState['status']) {
  if (!audience) return status === 'loading' ? 'Chargement des statistiques de fréquentation.' : 'Statistiques momentanément indisponibles.';
  const scope = audience.scope === 'local' ? 'Statistiques de cet aperçu local. '
    : audience.scope === 'preview' ? 'Statistiques de cet aperçu. ' : '';
  return `${scope}Visites par session depuis l’activation le ${dateFormat.format(new Date(audience.startedAt))}. En ligne : sessions actives durant les 3 dernières minutes. Seules les sessions ayant accepté la mesure d’audience sont comptées.`;
}

export function VisitorCounters() {
  const pathname = usePathname();
  const consent = useCookieConsent();
  const descriptionId = useId();
  const [state, setState] = useState<CounterState>({ status: 'loading', audience: null });
  const publicPage = !/^\/(crm|client|api|connexion|inscription)(\/|$)/.test(pathname);
  const analyticsAllowed = consent?.analytics === true;

  // One refresh loop chooses GET or POST, so an older aggregate response cannot
  // replace a newer heartbeat result or its availability state.
  useEffect(() => {
    if (!analyticsAllowed) {
      // The hook initially returns null. Preserve an existing consented session
      // until hydration reads it; clear a refused, missing or expired choice.
      if (!readCookieConsent()?.analytics) clearAudienceSession();
    }
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || controller.signal.aborted || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        let sessionId: string | null = null;
        if (analyticsAllowed && publicPage && readCookieConsent()?.analytics) {
          sessionId = await activeSessionId(controller.signal);
        }
        if (controller.signal.aborted || document.visibilityState !== 'visible') return;
        // Consent can change while the cross-tab session lock is pending.
        if (!readCookieConsent()?.analytics) sessionId = null;
        // GET remains available without consent or usable shared session storage.
        const audience = await fetchAudience(controller.signal, sessionId ?? undefined);
        if (!controller.signal.aborted) setState({ status: 'available', audience });
      } catch {
        if (!controller.signal.aborted) setState({ status: 'unavailable', audience: null });
      } finally { pending = false; }
    };
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, REFRESH_MS);
    document.addEventListener('visibilitychange', visible);
    return () => {
      controller.abort(); window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [analyticsAllowed, publicPage, pathname]);

  const description = audienceDescription(state.audience, state.status);
  const unavailable = state.status === 'unavailable' ? 'Indisponible' : '—';
  return <div className="nm-visitor-counters" title={description}>
    <dl aria-label="Fréquentation du site" aria-describedby={descriptionId} aria-busy={state.status === 'loading'}>
      <div><dt>Visites</dt><dd>{state.audience ? numberFormat.format(state.audience.totalVisits) : unavailable}</dd></div>
      <div><dt>En ligne</dt><dd>{state.audience ? numberFormat.format(state.audience.online) : unavailable}</dd></div>
    </dl>
    <p id={descriptionId} className="sr-only">{description}</p>
    <p className="sr-only" role="status" aria-live="polite">
      {state.status === 'loading' ? 'Chargement des statistiques…' : state.status === 'unavailable'
        ? 'Statistiques momentanément indisponibles.' : 'Statistiques disponibles.'}
    </p>
  </div>;
}
