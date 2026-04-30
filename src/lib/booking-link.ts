const DEFAULT_BOOKING_URL = 'https://calendly.com/simonmorin-nowis/30min';
const DEFAULT_WORKSHOP_BOOKING_URL = 'https://calendly.com/simonmorin-nowis/atelier';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getBookingBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() ||
    process.env.CALENDLY_BOOKING_URL?.trim() ||
    process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL?.trim() ||
    process.env.BOOKING_CALENDAR_URL?.trim() ||
    DEFAULT_BOOKING_URL;

  return trimTrailingSlash(raw);
}

export function getWorkshopBookingBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_WORKSHOP_CALENDLY_URL?.trim() ||
    process.env.WORKSHOP_CALENDLY_URL?.trim() ||
    process.env.NEXT_PUBLIC_ATELIER_CALENDLY_URL?.trim() ||
    process.env.ATELIER_CALENDLY_URL?.trim() ||
    DEFAULT_WORKSHOP_BOOKING_URL;

  return trimTrailingSlash(raw);
}

export function getBookingEmbedUrl() {
  const baseUrl = getBookingBaseUrl();
  if (/(^https?:\/\/)?(www\.)?calendly\.com\//i.test(baseUrl)) {
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
