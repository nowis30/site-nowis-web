/*
 * Résumés courts des documents de référence vérifiés.
 * Les arcanes mineurs sont des associations famille/rang, pas des fiches
 * individuelles citées. Les questions de tirage sont rédigées pour cette app.
 */
(function () {
  'use strict';

  const notebookUrl = '';
  const sources = [
    {
      id: 'street',
      title: 'Street Tarots — Méthode de tirage',
      url: 'https://www.its-ok.fr/img/tmp/cms/methode-de-tirage.pdf',
      kind: 'direct'
    },
    {
      id: 'mineurs',
      title: 'Apprendre le Tarot de Marseille — Les arcanes mineurs',
      url: 'https://www.apprendre-tarotdemarseille.com/guide-interpr%C3%A9tation-gratuit-tarot-de-marseille/les-arcanes-mineurs/',
      kind: 'method'
    }
  ];

  const majorDefinitions = [
    [1, 'I', 'Le Bateleur', ['commencement', 'potentiel', 'action'], 'Commencement, possibilités et passage à l’action.'],
    [2, 'II', 'La Papesse', ['intuition', 'sagesse'], 'Savoir intérieur et connaissances encore cachées.'],
    [3, 'III', 'L’Impératrice', ['créativité', 'abondance'], 'Création, fécondité des idées et abondance.'],
    [4, 'IIII', 'L’Empereur', ['autorité', 'stabilité'], 'Autorité, cadre et stabilité.'],
    [5, 'V', 'Le Pape', ['tradition', 'transmission'], 'Traditions, enseignements et dimension spirituelle.'],
    [6, 'VI', 'L’Amoureux', ['choix', 'relations'], 'Choix, amour et liens affectifs.'],
    [7, 'VII', 'Le Chariot', ['détermination', 'victoire'], 'Avancer avec volonté et maîtrise.'],
    [8, 'VIII', 'La Justice', ['équilibre', 'vérité'], 'Équilibre, vérité et décisions.'],
    [9, 'VIIII', 'L’Hermite', ['retrait', 'sagesse'], 'Retrait, recherche intérieure et sagesse.'],
    [10, 'X', 'La Roue de Fortune', ['changement', 'chance'], 'Changement, chance et destin.'],
    [11, 'XI', 'La Force', ['courage', 'maîtrise'], 'Courage et maîtrise de sa force intérieure.'],
    [12, 'XII', 'Le Pendu', ['pause', 'perspective'], 'Pause, renoncement et regard différent.'],
    [13, 'XIII', 'L’Arcane sans nom', ['transformation', 'renouveau'], 'Fin d’une étape, transformation et renouveau.'],
    [14, 'XIIII', 'Tempérance', ['équilibre', 'modération'], 'Équilibre et mesure.'],
    [15, 'XV', 'Le Diable', ['tentation', 'dépendance'], 'Tentations, dépendances et liens qui entravent.'],
    [16, 'XVI', 'La Maison Dieu', ['bouleversement', 'révélation'], 'Bouleversement, révélation et déconstruction.'],
    [17, 'XVII', 'L’Étoile', ['espoir', 'inspiration'], 'Espoir, inspiration et orientation.'],
    [18, 'XVIII', 'La Lune', ['intuition', 'illusion'], 'Rêves, intuition et apparences trompeuses.'],
    [19, 'XVIIII', 'Le Soleil', ['joie', 'clarté'], 'Joie, réussite et clarté.'],
    [20, 'XX', 'Le Jugement', ['éveil', 'renaissance'], 'Prise de conscience, révélation et nouveau départ.'],
    [21, 'XXI', 'Le Monde', ['accomplissement', 'plénitude'], 'Accomplissement, intégration et plénitude.']
  ];

  const cards = [{
    id: 'major-0',
    name: 'Le Mat',
    number: 0,
    roman: '',
    family: 'Majeurs',
    keywords: [],
    meaning: 'Aucune définition du Mat n’a encore été vérifiée dans les sources actuellement consultées.',
    sourceIds: [],
    coverage: 'missing'
  }].concat(majorDefinitions.map(function (entry) {
    return {
      id: 'major-' + entry[0],
      name: entry[2],
      number: entry[0],
      roman: entry[1],
      family: 'Majeurs',
      keywords: entry[3],
      meaning: entry[4],
      sourceIds: ['street'],
      coverage: 'direct'
    };
  }));

  // La source expose une grille de lecture : domaine de l’enseigne + rang.
  const families = [
    { id: 'batons', name: 'Bâtons', domain: 'professionnel' },
    { id: 'coupes', name: 'Coupes', domain: 'affectif' },
    { id: 'epees', name: 'Épées', domain: 'intellectuel' },
    { id: 'deniers', name: 'Deniers', domain: 'financier' }
  ];
  const ranks = [
    { name: 'As', roman: 'I', keys: ['début'], meaning: 'commencement' },
    { name: 'Deux', roman: 'II', keys: ['dualité'], meaning: 'dualité' },
    { name: 'Trois', roman: 'III', keys: ['création'], meaning: 'création' },
    { name: 'Quatre', roman: 'IIII', keys: ['concrétisation'], meaning: 'concrétisation' },
    { name: 'Cinq', roman: 'V', keys: ['évolution'], meaning: 'évolution, gains et pertes' },
    { name: 'Six', roman: 'VI', keys: ['transition', 'choix'], meaning: 'transition et choix' },
    { name: 'Sept', roman: 'VII', keys: ['victoire', 'obstacles'], meaning: 'victoire et obstacles' },
    { name: 'Huit', roman: 'VIII', keys: ['équilibre', 'mouvement'], meaning: 'équilibre et mouvement' },
    { name: 'Neuf', roman: 'VIIII', keys: ['expérience'], meaning: 'apogée et expérience' },
    { name: 'Dix', roman: 'X', keys: ['aboutissement'], meaning: 'aboutissement' },
    { name: 'Valet', roman: '', keys: ['projet', 'essai'], meaning: 'projet et expérimentation' },
    { name: 'Cavalier', roman: '', keys: ['action'], meaning: 'action' },
    { name: 'Reine', roman: '', keys: ['patience'], meaning: 'compréhension et patience' },
    { name: 'Roi', roman: '', keys: ['pouvoir', 'connaissance'], meaning: 'pouvoir et connaissance' }
  ];

  families.forEach(function (family) {
    ranks.forEach(function (rank, index) {
      cards.push({
        id: family.id + '-' + (index + 1),
        name: rank.name + (family.name === 'Épées' ? ' d’' : ' de ') + family.name,
        number: index + 1,
        roman: rank.roman,
        family: family.name,
        keywords: [family.domain].concat(rank.keys),
        meaning: 'Association famille/rang : domaine ' + family.domain + ' + ' + rank.meaning + '.',
        sourceIds: ['mineurs'],
        coverage: 'method'
      });
    });
  });

  window.TAROT_DATA = {
    notebookUrl: notebookUrl,
    tradition: 'Tarot de Marseille',
    sources: sources,
    cards: cards,
    spreads: {
      '2': [
        { title: 'Problème', prompt: 'Quel aspect de la situation mérite votre attention ?' },
        { title: 'Solution', prompt: 'Quelle piste concrète pourriez-vous explorer ?' }
      ],
      '3': [
        { title: 'Passé', prompt: 'Quelle expérience passée éclaire votre question ?' },
        { title: 'Présent', prompt: 'Qu’observez-vous dans votre situation actuelle ?' },
        { title: 'Avenir', prompt: 'Quelle possibilité pourriez-vous envisager pour la suite ?' }
      ],
      '4': [
        { title: 'Situation', prompt: 'Quel point décrit le mieux ce que vous vivez ?' },
        { title: 'Obstacle', prompt: 'Qu’est-ce qui freine votre progression ?' },
        { title: 'Aide', prompt: 'Sur quelle ressource pourriez-vous vous appuyer ?' },
        { title: 'Résultat', prompt: 'Quel résultat souhaitez-vous construire ?' }
      ],
      '5': [
        { title: 'Passé', prompt: 'Qu’avez-vous appris de ce qui précède ?' },
        { title: 'Présent', prompt: 'Qu’est-ce qui compte pour vous maintenant ?' },
        { title: 'Avenir', prompt: 'Quelle direction souhaiteriez-vous explorer ?' },
        { title: 'Conseil', prompt: 'Quel petit pas pourriez-vous choisir ?' },
        { title: 'Synthèse', prompt: 'Quel fil relie vos réflexions sur ces cartes ?' }
      ]
    }
  };
}());
