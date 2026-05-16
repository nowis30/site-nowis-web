function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function pickFirstEnv(candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function requireBookingUrl(candidates: Array<string | undefined>, context: 'global' | 'workshop') {
  const value = pickFirstEnv(candidates);
  if (value) return trimTrailingSlash(value);

  const baseHint = context === 'workshop'
    ? 'NEXT_PUBLIC_WORKSHOP_GOOGLE_CALENDAR_EMBED_URL / WORKSHOP_GOOGLE_CALENDAR_EMBED_URL'
    : 'NEXT_PUBLIC_BOOKING_CALENDAR_URL / BOOKING_CALENDAR_URL / NEXT_PUBLIC_GOOGLE_BOOKING_URL';

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Booking URL non configurée. Définissez ${baseHint}. Fallback temporaire: about:blank`);
  }

  // Safe fallback to keep pages renderable even if env vars are missing.
  return 'about:blank';
}

export function getBookingBaseUrl() {
  return requireBookingUrl([
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL,
    process.env.GOOGLE_BOOKING_URL,
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL,
    process.env.GOOGLE_CALENDAR_EMBED_URL,
    process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL,
    process.env.BOOKING_CALENDAR_URL,
    // Legacy fallback retained for historical compatibility.
    process.env.NEXT_PUBLIC_CALENDLY_URL,
    process.env.CALENDLY_BOOKING_URL,
  ], 'global');
}

export function getWorkshopBookingBaseUrl() {
  const workshopSpecific = pickFirstEnv([
    process.env.NEXT_PUBLIC_WORKSHOP_GOOGLE_CALENDAR_EMBED_URL,
    process.env.WORKSHOP_GOOGLE_CALENDAR_EMBED_URL,
    process.env.NEXT_PUBLIC_ATELIER_GOOGLE_CALENDAR_EMBED_URL,
    process.env.ATELIER_GOOGLE_CALENDAR_EMBED_URL,
    // Legacy fallback retained for historical compatibility.
    process.env.NEXT_PUBLIC_WORKSHOP_CALENDLY_URL,
    process.env.WORKSHOP_CALENDLY_URL,
    process.env.NEXT_PUBLIC_ATELIER_CALENDLY_URL,
    process.env.ATELIER_CALENDLY_URL,
  ]);

  if (workshopSpecific) {
    return trimTrailingSlash(workshopSpecific);
  }

  return requireBookingUrl([
    process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL,
    process.env.GOOGLE_BOOKING_URL,
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL,
    process.env.GOOGLE_CALENDAR_EMBED_URL,
    process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL,
    process.env.BOOKING_CALENDAR_URL,
    process.env.NEXT_PUBLIC_CALENDLY_URL,
    process.env.CALENDLY_BOOKING_URL,
  ], 'workshop');
}

export function getBookingEmbedUrl() {
  const baseUrl = getBookingBaseUrl();
  if (/(^https?:\/\/)?(www\.)?calendly\.com\//i.test(baseUrl)) {
    return baseUrl;
  }
  if (/(^https?:\/\/)?calendar\.google\.com\/calendar\/embed/i.test(baseUrl)) {
    return baseUrl;
  }
  return baseUrl.includes('?') ? `${baseUrl}&embed=true` : `${baseUrl}?embed=true`;
}

export function buildBookingUrlWithPrefill(prefill: {
  name?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  const baseUrl = getBookingBaseUrl();
  const url = new URL(baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`);

  if (prefill.name) url.searchParams.set('name', prefill.name);
  if (prefill.email) url.searchParams.set('email', prefill.email);
  if (prefill.notes) url.searchParams.set('notes', prefill.notes);

  return url.toString();
}

export function buildWorkshopBookingUrlWithPrefill(prefill: {
  name?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  const baseUrl = getWorkshopBookingBaseUrl();
  const url = new URL(baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`);

  if (prefill.name) url.searchParams.set('name', prefill.name);
  if (prefill.email) url.searchParams.set('email', prefill.email);
  if (prefill.notes) url.searchParams.set('notes', prefill.notes);

  return url.toString();
}
