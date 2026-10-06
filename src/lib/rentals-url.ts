const DEFAULT_RENTALS_PUBLIC_URL = 'https://simon-morin-agent-location.onrender.com';

export function resolveRentalsPublicUrl(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return DEFAULT_RENTALS_PUBLIC_URL;
  }
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return DEFAULT_RENTALS_PUBLIC_URL;
    }
    return normalized;
  } catch {
    return DEFAULT_RENTALS_PUBLIC_URL;
  }
}

export const rentalsPublicUrl = resolveRentalsPublicUrl(process.env.NEXT_PUBLIC_RENTALS_URL);
