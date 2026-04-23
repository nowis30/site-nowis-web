export const launchOffer = {
  title: 'Offre de lancement — 50 % de rabais jusqu’au 1er juillet 2026',
  description:
    'Profitez du lancement pour réserver votre chanson personnalisée, votre vidéo IA ou votre atelier à moitié prix.',
  note: 'Offre valide sur les nouveaux projets réservés avant le 1er juillet 2026.',
  ctaLabel: 'Réserver maintenant',
  ctaHref:
    '/contact?projectType=autre&message=Bonjour, je veux profiter de l’offre de lancement de 50 % avant le 1er juillet 2026 pour discuter de mon projet.',
} as const;

export type LaunchOffer = typeof launchOffer;