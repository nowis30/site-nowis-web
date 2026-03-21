import { socialLinks } from '@/config/socialLinks';

export type ArtistPlatform = {
  key: 'spotify' | 'youtube' | 'youtubeMusic';
  label: string;
  url?: string;
  embedUrl?: string;
  ctaLabel: string;
  placeholder?: string;
};

export type ArtistFeaturedSong = {
  title: string;
  href: string;
  description: string;
  platform: string;
  external?: boolean;
};

export type ArtistMember = {
  name: string;
  subtitle: string;
  description: string;
};

export type ArtistProfile = {
  slug: string;
  name: string;
  pageTitle: string;
  role: string;
  hook: string;
  shortBio: string;
  cardSummary: string;
  seoDescription: string;
  image?: {
    src: string;
    alt: string;
  };
  heroHighlights: string[];
  overviewTitle: string;
  overviewLabel: string;
  longBio: string[];
  journeyTitle: string;
  journeyLabel: string;
  journey: string[];
  members?: ArtistMember[];
  customCreationsTitle: string;
  customCreationsLabel: string;
  customCreationsIntro: string[];
  customCreationsExamples: string[];
  pricingNote: string;
  listeningTitle: string;
  associationTitle: string;
  associationLabel: string;
  associationText: string[];
  featuredSongs: ArtistFeaturedSong[];
  platforms: ArtistPlatform[];
  contactHref: string;
};

function buildContactHref(message: string) {
  return `/contact?projectType=chanson&message=${encodeURIComponent(message)}`;
}

export const artists: ArtistProfile[] = [
  {
    slug: 'nowis-morin',
    name: 'Nowis Morin',
    pageTitle: 'Nowis Morin',
    role: 'Artiste principal de Création Nowis',
    hook: 'Des chansons francophones créées pour toucher, raconter et rester.',
    shortBio:
      'Nowis Morin développe un univers musical, visuel et vidéo où l’intelligence artificielle sert d’atelier discret pour donner une forme durable aux émotions, aux souvenirs et aux projets créatifs.',
    cardSummary:
      'L’artiste principal derrière Création Nowis, avec une approche humaine, francophone et centrée sur les chansons personnalisées, les visuels et les concepts qui marquent.',
    seoDescription:
      'Découvre Nowis Morin, artiste principal de Création Nowis : bio, démarche, chansons personnalisées, écoute Spotify et YouTube, projets visuels et vidéo.',
    image: {
      src: '/hero.jpg',
      alt: 'Nowis Morin, artiste principal de Création Nowis',
    },
    heroHighlights: ['Chansons francophones', 'IA au service de l’émotion', 'Créations sur mesure'],
    overviewTitle: 'Biographie',
    overviewLabel: 'Bio',
    longBio: [
      'Nowis Morin est au cœur de Création Nowis. Passionné de musique depuis l’adolescence, il joue et chante depuis l’âge d’environ 15 ans. Bien avant d’utiliser l’intelligence artificielle, il avait déjà cette habitude de créer des chansons spontanément, au fil de l’émotion, en chantant, en improvisant et en laissant les mots venir naturellement.',
      'Pendant longtemps, une réalité revenait toujours : les idées naissaient sur le moment, mais elles repartaient aussi vite. Les chansons inventées restaient rarement assez stables pour être retenues, rejouées ou reconstruites plus tard. C’est là que l’intelligence artificielle est entrée dans son parcours, non pas pour remplacer la création, mais pour l’aider à garder vivantes des chansons qu’il portait déjà en lui.',
      'Au départ, l’objectif était simple : réussir à créer de belles chansons qu’il pourrait réellement reprendre plus tard, chanter avec sa guitare, rejouer au bord d’un feu ou garder comme souvenirs durables. L’IA a donc été pour lui un outil de structure, de mémoire et de mise en forme, capable de transformer une idée passagère en chanson plus complète, plus solide et plus facile à faire vivre dans le temps.',
      'Avec les mois, cette démarche a évolué. À la musique se sont ajoutés les visuels, les vidéos, les concepts et tout l’univers créatif qui peut entourer une chanson. Ce qui était au départ une façon de mieux conserver ses idées est devenu une vraie passion, puis une direction professionnelle.',
      'Aujourd’hui, Nowis Morin développe des projets musicaux et visuels à travers Création Nowis, avec une approche humaine, francophone et centrée sur l’émotion. Son intérêt va autant vers les chansons personnalisées pour les mariages, les naissances, les histoires d’amour, les hommages ou les deuils, que vers les projets plus créatifs construits avec des images, des vidéos et une identité visuelle adaptée.',
      'Création Nowis repose sur une idée simple : utiliser l’intelligence artificielle comme un outil au service du cœur, des souvenirs et de la création. Le but n’est pas de faire du faux. Le but est de rendre une émotion plus concrète, plus durable et plus facile à partager.',
    ],
    journeyTitle: 'Mon parcours',
    journeyLabel: 'Parcours',
    journey: [
      'Au fil du temps, Nowis a appris à utiliser l’IA comme un prolongement de sa démarche musicale : pour structurer une idée, tester des couleurs sonores, soutenir une ambiance visuelle et mieux faire vivre une chanson au-delà de l’instant où elle naît.',
      'Cette évolution lui permet aujourd’hui de penser un projet dans son ensemble : chanson, direction émotionnelle, univers visuel, vidéo, présence web et cohérence de marque artistique.',
      'Son objectif reste pourtant simple et constant : créer quelque chose de vrai, de sensible et de partageable, sans perdre la chaleur humaine derrière l’outil.',
    ],
    customCreationsTitle: 'Créations personnalisées',
    customCreationsLabel: 'Sur mesure',
    customCreationsIntro: [
      'Création Nowis peut réaliser des chansons sur mesure à partir d’une histoire réelle, de souvenirs ou d’un événement important. L’idée n’est pas de produire un modèle générique, mais de transformer une émotion ou un vécu en chanson qui vous ressemble.',
      'Selon le projet, cette création peut aussi être prolongée par des visuels, une vidéo simple, une mise en ligne ou une direction plus complète pour mettre le résultat en valeur.',
    ],
    customCreationsExamples: ['Mariage', 'Naissance', 'Hommage', 'Décès', 'Histoire d’amour', 'Souvenir de famille', 'Projet personnel'],
    pricingNote:
      'Les créations sur mesure sont proposées selon la nature du projet, avec une direction claire, un échange humain et des compléments visuels possibles si cela aide vraiment le rendu.',
    listeningTitle: 'Écouter Nowis Morin',
    associationTitle: 'Création Nowis, une bannière pour faire vivre les projets',
    associationLabel: 'Création Nowis',
    associationText: [
      'Comme artiste principal, Nowis Morin donne la direction émotionnelle et créative de Création Nowis. La musique y côtoie naturellement les visuels, les vidéos et les concepts pensés pour mieux raconter une histoire.',
      'Cette bannière permet aussi d’ouvrir la porte à des commandes sur mesure pour des particuliers, des familles ou des clients qui veulent transformer une idée en pièce musicale ou visuelle forte.',
    ],
    featuredSongs: [
      {
        title: 'J’ai le goût de te voir',
        href: '/chanson/j-ai-le-gout-de-te-voir',
        description: 'Une chanson intime et familiale portée par la proximité, le manque et l’amour d’un père.',
        platform: 'Page chanson',
      },
      {
        title: 'Un père et sa fille',
        href: '/chanson/un-pere-et-sa-fille',
        description: 'Une pièce qui montre la dimension émotionnelle et narrative au cœur du projet artistique.',
        platform: 'Page chanson',
      },
      {
        title: 'Ta beauté',
        href: '/chanson/ta-beaute',
        description: 'Une facette plus romantique, conçue pour toucher sans tomber dans le surjeu.',
        platform: 'Page chanson',
      },
    ],
    platforms: [
      {
        key: 'spotify',
        label: 'Spotify',
        url: socialLinks.spotify,
        embedUrl: 'https://open.spotify.com/embed/artist/2zH00JaaHdcg4eII8dZUts?utm_source=generator',
        ctaLabel: 'Écouter sur Spotify',
      },
      {
        key: 'youtube',
        label: 'YouTube',
        url: socialLinks.youtube,
        ctaLabel: 'Voir sur YouTube',
      },
      {
        key: 'youtubeMusic',
        label: 'YouTube Music',
        url: 'https://music.youtube.com/search?q=nowis+morin',
        ctaLabel: 'Écouter sur YouTube Music',
        placeholder: 'Lien de recherche YouTube Music utilisé en attendant un lien d’artiste permanent confirmé.',
      },
    ],
    contactHref: buildContactHref('Bonjour, je veux discuter d’une chanson personnalisée ou d’un projet créatif avec Création Nowis.'),
  },
  {
    slug: 'yemme-sx',
    name: 'Yemme & SX',
    pageTitle: 'Yemme & SX',
    role: 'Duo artistique associé à Création Nowis',
    hook: 'Deux frères, deux styles, une même vision créative sous la bannière Création Nowis.',
    shortBio:
      'Yemme & SX forment un duo associé à Création Nowis. Leur présence élargit la vitrine musicale avec une énergie familiale, des chansons enracinées dans le vécu et une couleur plus rock, plus libre et complémentaire.',
    cardSummary:
      'Le duo artistique associé à Création Nowis, capable d’apporter une couleur familiale, humaine, plus rock et parfois bilingue à l’ensemble du projet.',
    seoDescription:
      'Découvre Yemme & SX, duo artistique associé à Création Nowis : présentation du duo, portraits de Yemme et SX, écoute Spotify et vision artistique.',
    // Ajouter l'image officielle ici dès que le fichier existe dans public/images/artists/
    heroHighlights: ['Duo associé', 'Couleur familiale et rock', 'Univers complémentaire'],
    overviewTitle: 'Introduction du duo',
    overviewLabel: 'Intro',
    longBio: [
      'Yemme & SX forment un duo associé à Création Nowis. Frères jumeaux, ils apportent ensemble une présence musicale forte, humaine et complémentaire. Leur univers permet de présenter plusieurs couleurs sous une même bannière : des chansons enracinées dans le cœur, la famille et les valeurs, mais aussi des morceaux plus rock, plus directs et parfois ouverts au bilingue.',
      'Leur présence dans Création Nowis montre qu’un projet musical peut réunir différentes sensibilités tout en restant cohérent. Grâce à l’intelligence artificielle, il devient possible de soutenir la création, développer l’image, proposer des concepts visuels et bâtir une vitrine complète autour des chansons.',
    ],
    journeyTitle: 'Deux frères, deux styles, une même vision',
    journeyLabel: 'Le duo',
    journey: [
      'Ensemble, Yemme & SX montrent qu’il est possible de réunir des sensibilités différentes dans un même projet artistique. Leur duo enrichit Création Nowis en ajoutant un volet musical complémentaire, capable d’aller du plus humain au plus énergique, du plus familial au plus rock.',
      'Leur présence aide aussi à faire comprendre qu’une même bannière créative peut accueillir plusieurs directions musicales tout en gardant une identité forte, moderne et cohérente.',
    ],
    members: [
      {
        name: 'Yemme',
        subtitle: 'Jimmy Morin',
        description:
          'Yemme apporte au duo une énergie profondément liée à la famille, au vécu et aux valeurs humaines. Père de sept enfants, il représente une création enracinée dans le réel, dans le cœur et dans l’importance d’être présent pour les autres. Son approche artistique donne une couleur chaleureuse et rassembleuse au projet, portée par les liens, la résilience, l’amour familial et l’authenticité.',
      },
      {
        name: 'SX',
        subtitle: 'Tommy Morin',
        description:
          'SX apporte une couleur plus rock, plus appuyée et plus libre. Son style donne au duo une autre texture musicale, parfois plus intense, parfois plus percutante, avec une ouverture qui peut aller autant vers le français que vers l’anglais. Sa présence montre que l’IA peut soutenir plusieurs styles d’expression, y compris des morceaux avec plus de mordant, de poids et d’attitude.',
      },
    ],
    customCreationsTitle: 'Créations personnalisées et collaborations',
    customCreationsLabel: 'Créations',
    customCreationsIntro: [
      'Même si Yemme & SX représentent un duo artistique à part entière, leur présence dans Création Nowis rappelle aussi que la bannière peut accueillir des chansons personnalisées pour des clients qui veulent une création plus incarnée, plus familiale ou plus marquée.',
      'L’équipe peut ainsi travailler à partir d’un souvenir, d’une histoire ou d’une émotion pour construire une chanson sur mesure, puis l’accompagner au besoin d’un visuel ou d’une présentation adaptée.',
    ],
    customCreationsExamples: ['Mariage', 'Naissance', 'Hommage', 'Décès', 'Histoire d’amour', 'Souvenir de famille', 'Projet personnel'],
    pricingNote:
      'Les créations sur mesure sont proposées selon la nature du projet, avec une direction claire, un échange humain et des compléments visuels possibles si cela aide vraiment le rendu.',
    listeningTitle: 'Écouter Yemme & SX',
    associationTitle: 'Des artistes associés qui renforcent la bannière Création Nowis',
    associationLabel: 'Volet associé',
    associationText: [
      'Yemme & SX font partie des artistes associés à Création Nowis. Leur duo donne de la profondeur au projet en montrant qu’une vitrine musicale peut rassembler plusieurs voix, plusieurs sensibilités et plusieurs intensités sans perdre sa cohérence.',
      'Cette présence renforce le positionnement de Création Nowis comme atelier créatif capable de produire des chansons, des visuels et des concepts adaptés à différents tempéraments artistiques.',
    ],
    featuredSongs: [
      {
        title: '47 ans plus tard',
        href: '/chanson/47-ans-plus-tard',
        description: 'Un morceau lié à la famille, au temps et à la transmission émotionnelle.',
        platform: 'Page chanson',
      },
      {
        title: 'Poussière de route',
        href: '/chanson/poussiere-de-route',
        description: 'Une couleur plus libre, plus voyageuse, qui montre une autre texture du duo.',
        platform: 'Page chanson',
      },
    ],
    platforms: [
      {
        key: 'spotify',
        label: 'Spotify',
        url: 'https://open.spotify.com/intl-fr/artist/5Mb1wPlL1iCHtjonXHNMfk?si=ta6ncpz_TVye2qT2ctNIoA',
        embedUrl: 'https://open.spotify.com/embed/artist/5Mb1wPlL1iCHtjonXHNMfk?utm_source=generator',
        ctaLabel: 'Écouter sur Spotify',
      },
      {
        key: 'youtube',
        label: 'YouTube',
        url: 'https://www.youtube.com/channel/UCUh-XBiPTFhn1if7wQeezCw',
        ctaLabel: 'Voir sur YouTube',
      },
      {
        key: 'youtubeMusic',
        label: 'YouTube Music',
        url: 'https://music.youtube.com/channel/UCUh-XBiPTFhn1if7wQeezCw',
        ctaLabel: 'Écouter sur YouTube Music',
      },
    ],
    contactHref: buildContactHref('Bonjour, je veux discuter d’une chanson personnalisée ou d’une collaboration créative avec Création Nowis.'),
  },
];

export function getAllArtists() {
  return artists;
}

export function getArtistBySlug(slug: string) {
  return artists.find((artist) => artist.slug === slug);
}
