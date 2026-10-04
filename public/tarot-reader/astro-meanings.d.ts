/** Types for the shared browser/CommonJS plain-language meaning corpus. */
interface AstroSource {
  title: string;
  url: string;
}

interface AstroMeaning {
  name: string;
  glyph?: string;
  meaning: string;
  focus?: string;
  action?: string;
  transitMeaning?: string;
  strengths?: string;
  balance?: string;
  style?: string;
  source: AstroSource;
}

declare const astroMeanings: {
  elements: Record<'Fire' | 'Earth' | 'Air' | 'Water', AstroMeaning>;
  planets: Record<'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto', AstroMeaning>;
  angles: Record<'ascendant' | 'midheaven', AstroMeaning>;
  signs: (AstroMeaning & { element: string })[];
  houses: (AstroMeaning & { number: number })[];
  aspects: (AstroMeaning & { angle: 0 | 60 | 90 | 120 | 180; bridge: string })[];
  sources: AstroSource[];
  notesSources: string;
};

export = astroMeanings;
