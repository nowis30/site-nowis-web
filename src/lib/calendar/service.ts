import {
  CalendarConnection,
  CalendarConnectionStatus,
  CalendarEventStatus,
  CalendarProvider,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { decryptCalendarToken, encryptCalendarToken } from '@/lib/calendar/token-crypto';

type CalendarProfile = {
  providerAccountId: string;
  accountEmail: string | null;
  accountName: string | null;
};

type ProviderTokenResult = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
};

type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
};

type RawProviderConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
};

type ProviderEventRecord = {
  externalEventId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  timezone: string | null;
  location: string | null;
  meetingUrl: string | null;
  status: CalendarEventStatus;
  rawPayload: Prisma.JsonValue;
};

type CalendarCreateEventInput = {
  connectionId: string;
  title: string;
  description?: string | null;
  startAt: Date;
  endAt: Date;
  timezone?: string | null;
  location?: string | null;
  linkedCrmAppointmentId?: string | null;
  linkedWorkshopRequestId?: string | null;
  linkedClientId?: string | null;
  linkedOrganizationId?: string | null;
};

type SafeCalendarConnection = {
  id: string;
  provider: CalendarProvider;
  accountEmail: string | null;
  accountName: string | null;
  status: CalendarConnectionStatus;
  lastSyncedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  hasRefreshToken: boolean;
};

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export const CALENDAR_PROVIDER_LABELS: Record<CalendarProvider, string> = {
  GOOGLE: 'Google Calendar',
  MICROSOFT: 'Microsoft Calendar',
  CALENDLY: 'Google Calendar',
  ICLOUD: 'iCloud Calendar',
};

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseProvider(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'GOOGLE' || normalized === 'MICROSOFT' || normalized === 'CALENDLY' || normalized === 'ICLOUD') {
    return normalized as CalendarProvider;
  }
  throw new Error('Provider calendrier invalide.');
}

function getProviderConfig(provider: CalendarProvider): RawProviderConfig | null {
  switch (provider) {
    case 'GOOGLE':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
        redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI?.trim(),
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: GOOGLE_SCOPES,
      };
    case 'MICROSOFT':
    case 'CALENDLY':
    case 'ICLOUD':
      return null;
  }
}

function assertProviderConfig(provider: CalendarProvider) {
  const config = getProviderConfig(provider);
  if (!config) {
    throw new Error('Ce provider calendrier n’est pas encore disponible.');
  }
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error(`Variables OAuth manquantes pour ${CALENDAR_PROVIDER_LABELS[provider]}.`);
  }
  return {
    ...config,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  } satisfies ProviderConfig;
}

async function parseErrorResponse(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text) as { error?: string; error_description?: string; title?: string; message?: string };
    return json.error_description || json.message || json.title || json.error || text;
  } catch {
    return text;
  }
}

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInputJsonValue(value: Prisma.JsonValue) {
  return (value ?? Prisma.JsonNull) as Prisma.InputJsonValue;
}

function parseGoogleDate(value: { dateTime?: string; date?: string; timeZone?: string } | null | undefined) {
  if (!value) return null;
  return parseIsoDate(value.dateTime || value.date || null);
}

function toSafeConnection(connection: CalendarConnection): SafeCalendarConnection {
  return {
    id: connection.id,
    provider: connection.provider,
    accountEmail: connection.accountEmail,
    accountName: connection.accountName,
    status: connection.status,
    lastSyncedAt: connection.lastSyncedAt?.toISOString() || null,
    expiresAt: connection.expiresAt?.toISOString() || null,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
    lastError: connection.lastError,
    hasRefreshToken: !!connection.refreshTokenEncrypted,
  };
}

export function buildCalendarOAuthUrl(providerValue: string, state: string) {
  const provider = parseProvider(providerValue);
  const config = assertProviderConfig(provider);
  const url = new URL(config.authorizeUrl);

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);

  return url.toString();
}

async function exchangeAuthorizationCode(provider: CalendarProvider, code: string) {
  const config = assertProviderConfig(provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!data.access_token) {
    throw new Error('Réponse OAuth invalide: access_token manquant.');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresAt: typeof data.expires_in === 'number' ? new Date(Date.now() + data.expires_in * 1000) : null,
    scopes: data.scope ? data.scope.split(/\s+/).filter(Boolean) : config.scopes,
  } satisfies ProviderTokenResult;
}

async function refreshAccessToken(connection: CalendarConnection) {
  if (!connection.refreshTokenEncrypted) {
    throw new Error('Aucun refresh token disponible.');
  }

  const refreshToken = decryptCalendarToken(connection.refreshTokenEncrypted);
  if (!refreshToken) {
    throw new Error('Refresh token calendrier indisponible.');
  }

  const config = assertProviderConfig(connection.provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  body.set('redirect_uri', config.redirectUri);

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!data.access_token) {
    throw new Error('Refresh OAuth invalide: access_token manquant.');
  }

  const nextRefreshToken = data.refresh_token || refreshToken;
  const updated = await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptCalendarToken(data.access_token),
      refreshTokenEncrypted: encryptCalendarToken(nextRefreshToken),
      expiresAt: typeof data.expires_in === 'number' ? new Date(Date.now() + data.expires_in * 1000) : connection.expiresAt,
      scopes: data.scope ? data.scope.split(/\s+/).filter(Boolean) : connection.scopes,
      status: 'CONNECTED',
      lastError: null,
    },
  });

  return decryptCalendarToken(updated.accessTokenEncrypted);
}

async function getValidAccessToken(connection: CalendarConnection) {
  const rawToken = decryptCalendarToken(connection.accessTokenEncrypted);
  const nowWithSkew = Date.now() + 120000;

  if (rawToken && (!connection.expiresAt || connection.expiresAt.getTime() > nowWithSkew)) {
    return rawToken;
  }

  return refreshAccessToken(connection);
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await parseErrorResponse(response));
  const data = await response.json() as { id?: string; email?: string; name?: string };
  if (!data.id) throw new Error('Profil Google invalide.');
  return {
    providerAccountId: data.id,
    accountEmail: normalizeOptionalString(data.email),
    accountName: normalizeOptionalString(data.name),
  } satisfies CalendarProfile;
}

async function fetchProviderProfile(provider: CalendarProvider, accessToken: string) {
  if (provider === 'GOOGLE') return fetchGoogleProfile(accessToken);
  throw new Error('Seul Google Calendar est activé pour la connexion OAuth dans cette version.');
}

export async function connectCalendarProviderFromCode(providerValue: string, code: string, createdByUserId: string) {
  const provider = parseProvider(providerValue);
  const tokens = await exchangeAuthorizationCode(provider, code);
  const profile = await fetchProviderProfile(provider, tokens.accessToken);

  const connection = await prisma.calendarConnection.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    create: {
      provider,
      providerAccountId: profile.providerAccountId,
      accountEmail: profile.accountEmail,
      accountName: profile.accountName,
      accessTokenEncrypted: encryptCalendarToken(tokens.accessToken),
      refreshTokenEncrypted: encryptCalendarToken(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      status: 'CONNECTED',
      createdByUserId,
    },
    update: {
      accountEmail: profile.accountEmail,
      accountName: profile.accountName,
      accessTokenEncrypted: encryptCalendarToken(tokens.accessToken),
      refreshTokenEncrypted: encryptCalendarToken(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      status: 'CONNECTED',
      lastError: null,
      createdByUserId,
    },
  });

  return connection;
}

export async function listCalendarConnections() {
  const items = await prisma.calendarConnection.findMany({
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return [] as CalendarConnection[];
    }
    throw error;
  });

  return items.map(toSafeConnection);
}

async function fetchGoogleEvents(accessToken: string, startAt: Date, endAt: Date) {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', startAt.toISOString());
  url.searchParams.set('timeMax', endAt.toISOString());
  url.searchParams.set('maxResults', '250');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await parseErrorResponse(response));

  const data = await response.json() as { items?: Array<Record<string, unknown>> };
  return (data.items || []).flatMap((item) => {
    const start = parseGoogleDate(item.start as { dateTime?: string; date?: string } | undefined);
    const end = parseGoogleDate(item.end as { dateTime?: string; date?: string } | undefined);
    const externalEventId = typeof item.id === 'string' ? item.id : null;
    if (!start || !end || !externalEventId) return [] as ProviderEventRecord[];
    return [{
      externalEventId,
      title: typeof item.summary === 'string' && item.summary.trim() ? item.summary : 'Événement Google',
      description: normalizeOptionalString(typeof item.description === 'string' ? item.description : null),
      startAt: start,
      endAt: end,
      timezone: normalizeOptionalString((item.start as { timeZone?: string } | undefined)?.timeZone || (item.end as { timeZone?: string } | undefined)?.timeZone || null),
      location: normalizeOptionalString(typeof item.location === 'string' ? item.location : null),
      meetingUrl: normalizeOptionalString((typeof item.hangoutLink === 'string' ? item.hangoutLink : typeof item.htmlLink === 'string' ? item.htmlLink : null)),
      status: (typeof item.status === 'string' && item.status.toLowerCase() === 'cancelled') ? 'CANCELLED' : 'CONFIRMED',
      rawPayload: item as Prisma.JsonObject,
    } satisfies ProviderEventRecord];
  });
}

async function fetchProviderEvents(connection: CalendarConnection, accessToken: string, startAt: Date, endAt: Date) {
  if (connection.provider === 'GOOGLE') return fetchGoogleEvents(accessToken, startAt, endAt);
  throw new Error('Seul Google Calendar est activé pour la synchronisation dans cette version.');
}

async function saveProviderError(connectionId: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: {
      status: message.toLowerCase().includes('refresh') || message.toLowerCase().includes('expired') ? 'EXPIRED' : 'ERROR',
      lastError: message.slice(0, 1000),
    },
  }).catch(() => undefined);
}

export async function syncCalendarConnection(connectionId: string) {
  const connection = await prisma.calendarConnection.findUnique({ where: { id: connectionId } });
  if (!connection) {
    throw new Error('Connexion calendrier introuvable.');
  }
  if (connection.status === 'DISCONNECTED') {
    throw new Error('Cette connexion calendrier est déconnectée.');
  }

  const startAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const endAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);

  try {
    const accessToken = await getValidAccessToken(connection);
    if (!accessToken) {
      throw new Error('Access token indisponible.');
    }

    const events = await fetchProviderEvents(connection, accessToken, startAt, endAt);

    for (const event of events) {
      await prisma.calendarExternalEvent.upsert({
        where: {
          connectionId_externalEventId: {
            connectionId: connection.id,
            externalEventId: event.externalEventId,
          },
        },
        create: {
          connectionId: connection.id,
          provider: connection.provider,
          externalEventId: event.externalEventId,
          title: event.title,
          description: event.description,
          startAt: event.startAt,
          endAt: event.endAt,
          timezone: event.timezone,
          location: event.location,
          meetingUrl: event.meetingUrl,
          status: event.status,
          rawPayload: toInputJsonValue(event.rawPayload),
        },
        update: {
          provider: connection.provider,
          title: event.title,
          description: event.description,
          startAt: event.startAt,
          endAt: event.endAt,
          timezone: event.timezone,
          location: event.location,
          meetingUrl: event.meetingUrl,
          status: event.status,
          rawPayload: toInputJsonValue(event.rawPayload),
        },
      });
    }

    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        status: 'CONNECTED',
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });

    return {
      connectionId: connection.id,
      provider: connection.provider,
      imported: events.length,
    };
  } catch (error) {
    await saveProviderError(connection.id, error);
    throw error;
  }
}

export async function syncCalendarConnections(connectionId?: string | null) {
  if (connectionId) {
    return [await syncCalendarConnection(connectionId)];
  }

  const connections = await prisma.calendarConnection.findMany({
    where: {
      status: {
        in: ['CONNECTED', 'EXPIRED', 'ERROR'],
      },
    },
    orderBy: { updatedAt: 'desc' },
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return [] as CalendarConnection[];
    }
    throw error;
  });

  const results = [] as Array<{ connectionId: string; provider: CalendarProvider; imported: number }>;
  for (const connection of connections) {
    results.push(await syncCalendarConnection(connection.id));
  }
  return results;
}

export async function disconnectCalendarConnection(connectionId: string) {
  const item = await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: {
      status: 'DISCONNECTED',
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      expiresAt: null,
      lastError: null,
    },
  });

  return toSafeConnection(item);
}

export async function listStoredCalendarEvents(filters?: {
  provider?: CalendarProvider | null;
  contactId?: string | null;
  organizationId?: string | null;
}) {
  return prisma.calendarExternalEvent.findMany({
    where: {
      status: { not: 'DELETED' },
      ...(filters?.provider ? { provider: filters.provider } : {}),
      ...(filters?.contactId ? { linkedClientId: filters.contactId } : {}),
      ...(filters?.organizationId ? { linkedOrganizationId: filters.organizationId } : {}),
    },
    include: {
      connection: true,
      linkedClient: { select: { id: true, fullName: true } },
      linkedOrganization: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' },
    take: 500,
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return [];
    }
    throw error;
  });
}

async function createGoogleEvent(accessToken: string, input: CalendarCreateEventInput) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: input.title,
      description: input.description || undefined,
      location: input.location || undefined,
      start: {
        dateTime: input.startAt.toISOString(),
        timeZone: input.timezone || 'America/Toronto',
      },
      end: {
        dateTime: input.endAt.toISOString(),
        timeZone: input.timezone || 'America/Toronto',
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(await parseErrorResponse(response));
  const data = await response.json() as Record<string, unknown>;
  const eventId = typeof data.id === 'string' ? data.id : null;
  if (!eventId) throw new Error('Google n’a pas retourné d’identifiant d’événement.');

  return {
    externalEventId: eventId,
    title: typeof data.summary === 'string' ? data.summary : input.title,
    description: normalizeOptionalString(typeof data.description === 'string' ? data.description : input.description || null),
    startAt: parseGoogleDate(data.start as { dateTime?: string; date?: string } | undefined) || input.startAt,
    endAt: parseGoogleDate(data.end as { dateTime?: string; date?: string } | undefined) || input.endAt,
    timezone: normalizeOptionalString((data.start as { timeZone?: string } | undefined)?.timeZone || null),
    location: normalizeOptionalString(typeof data.location === 'string' ? data.location : input.location || null),
    meetingUrl: normalizeOptionalString((typeof data.hangoutLink === 'string' ? data.hangoutLink : typeof data.htmlLink === 'string' ? data.htmlLink : null)),
    status: 'CONFIRMED' as CalendarEventStatus,
    rawPayload: data as Prisma.JsonObject,
  } satisfies ProviderEventRecord;
}

export async function createExternalCalendarEvent(input: CalendarCreateEventInput) {
  const connection = await prisma.calendarConnection.findUnique({ where: { id: input.connectionId } });
  if (!connection) {
    throw new Error('Connexion calendrier introuvable.');
  }
  if (connection.status === 'DISCONNECTED') {
    throw new Error('Cette connexion calendrier est déconnectée.');
  }

  const accessToken = await getValidAccessToken(connection);
  if (!accessToken) {
    throw new Error('Access token indisponible pour cette connexion calendrier.');
  }

  if (connection.provider !== 'GOOGLE') {
    throw new Error('Seul Google Calendar est activé pour la création d’événements dans cette version.');
  }
  const remoteEvent = await createGoogleEvent(accessToken, input);

  return prisma.calendarExternalEvent.upsert({
    where: {
      connectionId_externalEventId: {
        connectionId: connection.id,
        externalEventId: remoteEvent.externalEventId,
      },
    },
    create: {
      connectionId: connection.id,
      provider: connection.provider,
      externalEventId: remoteEvent.externalEventId,
      title: remoteEvent.title,
      description: remoteEvent.description,
      startAt: remoteEvent.startAt,
      endAt: remoteEvent.endAt,
      timezone: remoteEvent.timezone,
      location: remoteEvent.location,
      meetingUrl: remoteEvent.meetingUrl,
      status: remoteEvent.status,
      rawPayload: toInputJsonValue(remoteEvent.rawPayload),
      linkedCrmAppointmentId: input.linkedCrmAppointmentId || null,
      linkedWorkshopRequestId: input.linkedWorkshopRequestId || null,
      linkedClientId: input.linkedClientId || null,
      linkedOrganizationId: input.linkedOrganizationId || null,
    },
    update: {
      title: remoteEvent.title,
      description: remoteEvent.description,
      startAt: remoteEvent.startAt,
      endAt: remoteEvent.endAt,
      timezone: remoteEvent.timezone,
      location: remoteEvent.location,
      meetingUrl: remoteEvent.meetingUrl,
      status: remoteEvent.status,
      rawPayload: toInputJsonValue(remoteEvent.rawPayload),
      linkedCrmAppointmentId: input.linkedCrmAppointmentId || null,
      linkedWorkshopRequestId: input.linkedWorkshopRequestId || null,
      linkedClientId: input.linkedClientId || null,
      linkedOrganizationId: input.linkedOrganizationId || null,
    },
  });
}

export async function recordCalendarActivity(input: {
  title: string;
  description?: string | null;
  userId?: string | null;
  relatedId?: string | null;
}) {
  return prisma.activity.create({
    data: {
      type: 'APPOINTMENT',
      title: input.title,
      description: normalizeOptionalString(input.description),
      userId: input.userId || null,
      relatedType: 'CALENDAR_CONNECTION',
      relatedId: input.relatedId || null,
    },
  }).catch(() => undefined);
}

export async function getCalendarConnectionById(connectionId: string) {
  return prisma.calendarConnection.findUnique({ where: { id: connectionId } });
}

export { parseProvider, toSafeConnection };