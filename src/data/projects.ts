export type Platform = 'spotify' | 'youtube' | 'printify' | 'other';

export type ProjectTemplate = {
  slug: string;
  title: string;
  description: string;
  details: string;
  image?: string;
  tags?: string[];
  url?: string; // Lien externe (Spotify / YouTube / Printify)
  platform?: Platform; // Permet d'afficher une icône claire
};

export const projects: ProjectTemplate[] = [
  {
    slug: 'chanson-personnalisee',
    title: 'Chanson personnalisée',
    description:
      'Une chanson créée à partir de votre histoire, vos émotions et votre univers.',
    details:
      'Je compose un morceau unique avec des paroles adaptées à votre histoire. Idéal pour cadeaux, anniversaires ou moments importants.',
    image: '/hero.jpg',
    tags: ['musique', 'chanson', 'personnalisé'],
    url: 'https://open.spotify.com/intl-fr/artist/2zH00JaaHdcg4eII8dZUts?si=S_03hL_DTWKLgIoQ7MewJw',
    platform: 'spotify',
  },
  {
    slug: 'video-teaser',
    title: 'Vidéo teaser',
    description:
      'Court clip conçu pour générer de l’engagement sur les réseaux sociaux.',
    details:
      'Je réalise une vidéo dynamique avec musique, transitions et un style visuel adapté à votre marque.',
    image: '/hero.jpg',
    tags: ['vidéo', 'réseaux sociaux', 'clip'],
    url: 'https://www.youtube.com/watch?v=Ke6lWgFNJvQ',
    platform: 'youtube',
  },
  {
    slug: 'projet-surprise',
    title: 'Projet surprise',
    description:
      'Une création originale mêlant son, image et créativité pour surprendre votre audience.',
    details:
      'Concept sur mesure : branchez vos idées et je vous propose un résultat inattendu et impactant.',
    image: '/hero.jpg',
    tags: ['créatif', 'original', 'surprise'],
    url: 'https://nowis.printify.me/',
    platform: 'printify',
  },
];
