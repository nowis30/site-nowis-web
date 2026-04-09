export const legalConfig = {
  companyName: 'Création Nowis',
  legalName: 'Simon Morin',
  businessIdLabel: "NEQ (Numéro d'entreprise du Québec)",
  businessIdValue: '2264731649',
  responsiblePrivacyTitle: 'Responsable de la protection des renseignements personnels',
  responsiblePrivacyName: 'Simon Morin',
  contactEmail: 'simonmorin@nowis.store',
  contactPhone: '(819) 388-3407',
  contactPhoneHref: 'tel:+18193883407',
  privacyEmail: 'simonmorin@nowis.store',
  privacyPhone: '(819) 388-3407',
  privacyPhoneHref: 'tel:+18193883407',
  // TODO: Ajouter le code postal ici lorsque confirmé.
  companyAddress: '4667, rue Traversy\nDrummondville (Québec)',
  companyAddressPlaceholder: '',
  companyRegion: 'Québec, Canada',
  currency: 'dollars canadiens',
  legalLastUpdated: '20 mars 2026',
};

export const privacyCollectionNotice = {
  text: 'En remplissant ce formulaire, vous acceptez que Création Nowis recueille les renseignements fournis pour répondre à votre demande, communiquer avec vous et assurer le suivi de votre projet. Vous pouvez demander l’accès, la correction ou le retrait de vos renseignements en communiquant avec notre responsable de la protection des renseignements personnels. Consultez notre politique de confidentialité pour en savoir plus.',
  bullets: [
    'Pourquoi on collecte : répondre à votre demande et assurer le suivi du projet.',
    'Qui peut y avoir accès : uniquement les personnes autorisées ou les fournisseurs techniques nécessaires au traitement.',
    'Comment joindre le responsable : par courriel ou téléphone aux coordonnées indiquées dans la politique.',
  ],
};

export const legalLinks = {
  legal: '/mentions-legales',
  privacy: '/confidentialite',
  terms: '/conditions-de-vente',
  contact: '/contact',
};

export const essentialCookies = [
  {
    name: 'nowis_session',
    purpose: 'Maintenir la session utilisateur dans les sections nécessitant une authentification.',
    duration: '30 jours maximum',
    required: true,
  },
];

export const complianceNotes = {
  noMarketingCookies:
    'Au moment de cette version, le site public n’installe pas de cookie publicitaire ou analytique non essentiel de façon déclarée.',
  cookieBannerRule:
    'Si des outils d’analyse, de publicité, de reciblage ou d’intégration tiers déposant des traceurs non essentiels sont ajoutés, un mécanisme de consentement préalable devra être mis en place avant leur activation.',
  legalReview:
    'Les contenus publiés améliorent la transparence publique du site, mais ils ne remplacent pas une validation juridique professionnelle adaptée à la situation exacte de l’entreprise.',
};

export const conditionsContent = {
  services: [
    'chansons personnalisées',
    'mise en chanson de textes, poèmes ou paroles déjà fournis',
    'options visuelles ou vidéo IA complémentaires',
    'autres services créatifs déjà présentés sur le site lorsque le projet est accepté',
  ],
  pricing: [
    'Chaque projet fait l’objet d’une validation avant confirmation finale.',
    'Le tarif applicable est communiqué selon la nature, la complexité et les besoins du projet.',
    'Les taxes sont ajoutées si elles sont applicables au projet ou au mode de facturation retenu.',
    'Le paiement se fait selon le mode confirmé directement au client.',
    'Une commande n’est confirmée qu’après validation du projet et acceptation des conditions applicables.',
  ],
  delays:
    'Les délais varient selon la nature du projet, sa complexité et les informations fournies par le client. Un délai estimatif est communiqué avant le début du projet.',
  revisions:
    'Le nombre de révisions ou d’ajustements est précisé au client avant la confirmation finale du projet, selon le type d’accompagnement retenu.',
  guarantee:
    'Si le résultat final proposé ne vous convient pas après la phase de révision prévue, Création Nowis peut offrir un remboursement selon les conditions du projet. Dans ce cas, le livrable remboursé n’est pas remis au client et demeure la propriété de Création Nowis.',
  cancellation: [
    'Avant le début réel du projet, une annulation peut être analysée au cas par cas selon l’état de validation et les frais déjà engagés.',
    'Après le début du projet, un remboursement complet n’est pas automatique, car une partie du travail créatif peut déjà avoir été réalisée.',
    'Si le client ne fournit pas les informations nécessaires dans un délai raisonnable, le projet peut être suspendu ou reporté jusqu’à réception des éléments attendus.',
    'En cas de remboursement accepté, le livrable remboursé n’est pas remis au client et demeure la propriété de Création Nowis.',
  ],
  intellectualProperty: [
    'Si le client fournit ses propres paroles, poèmes ou textes, il demeure propriétaire de ce contenu. En confiant son projet à Création Nowis, il autorise son utilisation dans le cadre de la création demandée.',
    'Sauf mention contraire écrite, les créations produites par Création Nowis sont fournies avec une licence d’utilisation adaptée au projet convenu. Toute cession complète de droits doit faire l’objet d’une entente distincte.',
    'L’usage personnel et l’usage commercial peuvent demander des modalités différentes. Si un projet est destiné à un usage commercial, cela doit être précisé avant la production finale.',
  ],
  distanceSelling: [
    'Les services sont offerts principalement à distance, au moyen du site web, du courriel, du téléphone ou d’un échange écrit direct avec le client.',
    'Avant la confirmation finale d’une commande, le client peut poser ses questions, vérifier les modalités applicables et demander des précisions sur le livrable, le délai, les révisions et les conditions financières.',
  ],
  governingLaw:
    'Sauf règle impérative contraire, les relations contractuelles avec Création Nowis sont interprétées selon les lois applicables au Québec et au Canada.',
};
