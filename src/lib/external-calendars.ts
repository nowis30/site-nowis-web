type ExternalCalendarSource = 'google_calendar' | 'microsoft_calendar';

type ParsedExternalCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  source: ExternalCalendarSource;
};

function decodeIcsText(value: string) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function unfoldIcsLines(rawText: string) {
  return rawText.replace(/\r?\n[ \t]/g, '');
}

function parseIcsDate(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  if (/^\d{8}$/.test(raw)) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6)) - 1;
    const day = Number(raw.slice(6, 8));
    return new Date(Date.UTC(year, month, day, 0, 0, 0));
  }

  const normalized = raw.replace(/^(\d{8})T(\d{6})Z?$/, '$1T$2Z');
  if (/^\d{8}T\d{6}Z$/.test(normalized)) {
    const year = Number(normalized.slice(0, 4));
    const month = Number(normalized.slice(4, 6)) - 1;
    const day = Number(normalized.slice(6, 8));
    const hour = Number(normalized.slice(9, 11));
    const minute = Number(normalized.slice(11, 13));
    const second = Number(normalized.slice(13, 15));
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  const asDate = new Date(raw);
  return Number.isNaN(asDate.getTime()) ? null : asDate;
}

function parseIcsEvents(rawText: string, source: ExternalCalendarSource) {
  const events: ParsedExternalCalendarEvent[] = [];
  const content = unfoldIcsLines(rawText);
  const blocks = content.split('BEGIN:VEVENT').slice(1);

  for (const block of blocks) {
    const eventText = block.split('END:VEVENT')[0] || '';
    const lines = eventText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const values: Record<string, string> = {};

    for (const line of lines) {
      const separator = line.indexOf(':');
      if (separator === -1) continue;
      const rawKey = line.slice(0, separator);
      const key = rawKey.split(';')[0].toUpperCase();
      const value = line.slice(separator + 1);
      values[key] = value;
    }

    const start = parseIcsDate(values.DTSTART || '');
    if (!start) continue;

    const end = parseIcsDate(values.DTEND || '') || new Date(start.getTime() + 60 * 60 * 1000);
    const title = decodeIcsText(values.SUMMARY || '').trim() || 'Événement externe';
    const description = decodeIcsText(values.DESCRIPTION || '') || null;
    const uid = values.UID || `${source}-${title}-${start.toISOString()}`;

    events.push({
      id: `${source}-${uid}`,
      title,
      description,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      source,
    });
  }

  return events;
}

async function fetchIcsCalendar(url: string, source: ExternalCalendarSource) {
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return [] as ParsedExternalCalendarEvent[];
    const text = await response.text();
    return parseIcsEvents(text, source);
  } catch {
    return [] as ParsedExternalCalendarEvent[];
  }
}

export async function loadExternalCalendarEvents() {
  const googleIcsUrl = process.env.CRM_GOOGLE_CALENDAR_ICS_URL?.trim();
  const microsoftIcsUrl = process.env.CRM_MICROSOFT_CALENDAR_ICS_URL?.trim();

  const [googleEvents, microsoftEvents] = await Promise.all([
    googleIcsUrl ? fetchIcsCalendar(googleIcsUrl, 'google_calendar') : Promise.resolve([] as ParsedExternalCalendarEvent[]),
    microsoftIcsUrl ? fetchIcsCalendar(microsoftIcsUrl, 'microsoft_calendar') : Promise.resolve([] as ParsedExternalCalendarEvent[]),
  ]);

  const now = Date.now();
  const maxHorizon = now + 1000 * 60 * 60 * 24 * 180;

  return [...googleEvents, ...microsoftEvents]
    .filter((item) => {
      const start = new Date(item.startAt).getTime();
      return Number.isFinite(start) && start >= now - 1000 * 60 * 60 * 24 * 30 && start <= maxHorizon;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
