export type GameLayout = 'square' | 'portrait' | 'landscape' | 'tall';
export type GameTouchAction = 'auto' | 'manipulation' | 'none';

export type GameExperienceProfile = {
  slug: string;
  layout: GameLayout;
  touchAction?: GameTouchAction;
};

// Only legacy games belong here. Rebuilt NOWIS games are mounted from their source
// engines and bypass this compatibility profile entirely.
const profiles: GameExperienceProfile[] = [
  {
    slug: 'simon-says',
    layout: 'square',
    touchAction: 'manipulation',
  },
  {
    slug: 'sliding-puzzle',
    layout: 'tall',
    touchAction: 'manipulation',
  },
];

const profileMap = new Map(profiles.map((profile) => [profile.slug, profile]));

const fallbackProfile: GameExperienceProfile = {
  slug: 'default',
  layout: 'portrait',
  touchAction: 'manipulation',
};

export function getGameExperience(slug: string): GameExperienceProfile {
  return profileMap.get(slug) ?? { ...fallbackProfile, slug };
}
