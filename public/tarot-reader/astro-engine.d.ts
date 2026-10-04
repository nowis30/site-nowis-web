/** Types for the shared browser/CommonJS astronomy module. */
interface AstrologyCalculationInput {
  birthDate: string;
  birthTime?: string;
  unknownTime?: boolean;
  latitude: number;
  longitude: number;
  timeZone: string;
  forecastDate: string;
  disambiguation?: 'earlier' | 'later';
}

interface SignPosition {
  longitude: number;
  signIndex: number;
  sign: string;
  element: string;
  degree: number;
  degreeText: string;
}

interface SkyPoint extends SignPosition {
  id: string;
  name: string;
  latitude?: number;
  speed?: number;
  retrograde?: boolean;
  stationary?: boolean;
  uncertain?: boolean;
  possibleSigns?: string[];
  indicative?: boolean;
  uncertaintyDegrees?: number;
  longitudeRange?: { start: number; end: number; width: number };
  house?: number | null;
}

interface NatalAspect {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  angle: number;
  aspect: string;
  orb: number;
  maxOrb: number;
  separation: number;
}

interface TransitAspect {
  transitId: string;
  transitName: string;
  natalId: string;
  natalName: string;
  angle: number;
  aspect: string;
  orb: number;
  maxOrb: number;
  separation: number;
  natalHouse: number | null;
  transitHouse: number | null;
  retrograde: boolean;
}

interface SkyChart {
  natal: {
    utc: string;
    timeKnown: boolean;
    planets: SkyPoint[];
    ascendant: SkyPoint | null;
    midheaven: SkyPoint | null;
    houses: (SignPosition & { number: number })[];
    aspects: NatalAspect[];
    anglesUnavailableReason: string | null;
    dayRange: { startUtc: string; endUtc: string; samplingMinutes: number } | null;
    offsetMinutes: number;
    localDate: string;
    localTime: string;
  };
  forecast: {
    utc: string;
    planets: SkyPoint[];
    localDate: string;
    localTime: string;
    offsetMinutes: number;
    timeZone: string;
  };
  transits: TransitAspect[];
  warnings: string[];
  location: { latitude: number; longitude: number; timeZone: string };
  methodology: {
    zodiac: string;
    coordinates: string;
    houseSystem: string;
    forecastTime: string;
    engine: string;
    localTimeRules: string;
    aspectOrbs: { angle: number; maxOrb: number }[];
    scientificNote: string;
  };
}

interface LocalTimeResolution {
  status: 'ambiguous' | 'unique';
  utc: string | null;
  offsetMinutes: number | null;
  occurrences: { utc: string; offsetMinutes: number; label: string }[];
  timeZone: string;
  date: string;
  time: string;
}

declare class AstroInputError extends Error {
  code: string;
  field: string | null;
  details: Record<string, unknown>;
  constructor(code: string, message: string, field?: string | null, details?: Record<string, unknown>);
}

declare const astroEngine: {
  calculate(input: AstrologyCalculationInput): SkyChart;
  resolveLocalTime(date: string, time: string, timeZone: string, disambiguation?: 'earlier' | 'later'): LocalTimeResolution;
  signPosition(longitude: number): SignPosition;
  angularDistance(a: number, b: number): number;
  houseFor(longitude: number, ascendant: SignPosition | null): number | null;
  AstroInputError: typeof AstroInputError;
  signs: string[];
  elements: string[];
  bodies: string[];
};

export = astroEngine;
