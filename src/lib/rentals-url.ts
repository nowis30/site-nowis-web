const DEFAULT_RENTALS_PUBLIC_URL = 'https://simon-morin-agent-location.onrender.com';

export function resolveRentalsPublicUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return DEFAULT_RENTALS_PUBLIC_URL;
  }
  return normalized;
}

export const rentalsPublicUrl = resolveRentalsPublicUrl(process.env.NEXT_PUBLIC_RENTALS_URL);
