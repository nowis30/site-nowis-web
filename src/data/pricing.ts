export const LAUNCH_DISCOUNT_PERCENT = 50 as const;
export const LAUNCH_END_DATE = '2026-07-01' as const;
export const LAUNCH_END_LABEL = '1er juillet 2026' as const;

export const REGULAR_PRICES = {
  workshops: {
    minutes60: 120,
    minutes90: 180,
    hours2: 240,
    hours3: 360,
  },
  hourly: 120,
  songs: {
    memorySong: 25,
    videoWithSong: 100,
  },
  groupFromPerPerson: 10,
} as const;

export function getLaunchPrice(regularPrice: number): number {
  return regularPrice * (1 - LAUNCH_DISCOUNT_PERCENT / 100);
}

export function formatPrice(amount: number, suffix = ''): string {
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat('fr-CA', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} $${suffix}`;
}

export const launchOfferText = `Offre de lancement : ${LAUNCH_DISCOUNT_PERCENT} % de rabais jusqu'au ${LAUNCH_END_LABEL}.`;
