const DEFAULT_BOOKING_URL = 'https://cal.com/simon-nowis-morin';

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

export function getBookingEmbedUrl() {
  const baseUrl = getBookingBaseUrl();
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
