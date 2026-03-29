const DEFAULT_BOOKING_URL = 'https://cal.com/simon-nowis-morin';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getBookingBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL?.trim() ||
    process.env.BOOKING_CALENDAR_URL?.trim() ||
    DEFAULT_BOOKING_URL;

  return trimTrailingSlash(raw);
}

export function getBookingEmbedUrl() {
  const baseUrl = getBookingBaseUrl();
  return baseUrl.includes('?') ? `${baseUrl}&embed=true` : `${baseUrl}?embed=true`;
}
