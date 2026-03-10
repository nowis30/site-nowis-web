export type ServiceOffer = {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
};

export const serviceOffers: ServiceOffer[] = [
  {
    title: 'Chansons personnalisées',
    subtitle: 'Pour marquer un moment, offrir une émotion ou raconter une histoire.',
    description:
      'Nowis Morin crée des chansons originales à partir de ton idée, de ton histoire ou de ton message, avec une direction artistique claire et un rendu moderne.',
    bullets: ['Cadeaux uniques', 'Projets personnels', 'Événements et hommages'],
  },
  {
    title: 'Vidéos personnalisées',
    subtitle: 'Pour capter l’attention et donner vie à ton univers.',
    description:
      'Des vidéos courtes, créatives et visuellement fortes, pensées pour les réseaux sociaux, la promotion d’un projet ou une identité artistique.',
    bullets: ['YouTube', 'Formats sociaux', 'Teasers artistiques'],
  },
  {
    title: 'Visuels créatifs',
    subtitle: 'Pour donner une signature visuelle cohérente à tes idées.',
    description:
      'Création d’ambiances visuelles, concepts, couvertures et images promotionnelles pour enrichir ta présence en ligne.',
    bullets: ['Visuels de lancement', 'Univers de marque', 'Direction artistique'],
  },
  {
    title: 'Concepts marketing avec IA',
    subtitle: 'Pour transformer une intuition en contenu plus fort et plus rapide.',
    description:
      'Nowis Morin combine intuition créative, narration et outils IA pour produire des concepts utiles aux artistes, entreprises et projets spéciaux.',
    bullets: ['Campagnes créatives', 'Idées de contenu', 'Projets spéciaux'],
  },
];
